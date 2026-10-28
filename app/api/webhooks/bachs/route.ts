import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bachsWebhookSecret, parseNgnAmount, verifyBachsWebhookSignature } from "@/lib/bachs";
import { sendBookingConfirmationEmail } from "@/lib/booking-confirmation";

type BachsEvent = {
  id?: unknown;
  type?: unknown;
  created_at?: unknown;
  data?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function POST(req: Request) {
  const secret = bachsWebhookSecret();
  if (!secret) {
    console.error("Bachs webhook rejected: BACHS_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await req.text();
  if (rawBody.length > 256_000) {
    return NextResponse.json({ error: "Webhook payload is too large." }, { status: 413 });
  }
  if (!verifyBachsWebhookSignature(rawBody, req.headers, secret)) {
    console.warn("Bachs webhook rejected: invalid or stale signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: BachsEvent;
  try {
    const parsed: unknown = JSON.parse(rawBody);
    if (!isRecord(parsed)) throw new Error("Webhook body must be an object");
    event = parsed;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const type = typeof event.type === "string" ? event.type : "";
  const data = isRecord(event.data) ? event.data : null;
  if (!data) return NextResponse.json({ error: "Invalid event data." }, { status: 400 });

  const status = String(data.status ?? "").toLowerCase();
  const isCollectionSucceeded = type === "collection.succeeded" && status === "succeeded";
  const isPaidCheckout = type === "checkout.completed" && String(data.payment_status ?? "").toLowerCase() === "paid";
  if (type === "collection.succeeded" && !isCollectionSucceeded) {
    console.warn("Bachs collection requires reconciliation", { status });
    return NextResponse.json({ received: true, ignored: type, status });
  }
  if (type === "checkout.completed" && data.mode !== undefined && data.mode !== "payment") {
    return NextResponse.json({ received: true, ignored: type, mode: data.mode });
  }
  if (!isCollectionSucceeded && !isPaidCheckout) {
    return NextResponse.json({ received: true, ignored: type || "unknown" });
  }

  const reference = typeof data.reference === "string" ? data.reference : "";
  const checkoutId = typeof data.checkout_id === "string" ? data.checkout_id : "";
  if (!reference && !checkoutId) {
    console.error("Bachs payment event is missing its booking reference and checkout ID", { type });
    return NextResponse.json({ error: "Payment reference is missing." }, { status: 400 });
  }

  const currency = String(data.currency ?? "").toUpperCase();
  const amount = parseNgnAmount(data.amount);
  if (currency !== "NGN" || amount === null) {
    console.error("Bachs payment event has an unsupported currency or amount", { type, currency });
    return NextResponse.json({ error: "Payment currency or amount is invalid." }, { status: 400 });
  }

  const charge = isRecord(data.charge) ? data.charge : null;
  const chargeId = typeof data.charge_id === "string"
    ? data.charge_id
    : typeof charge?.id === "string"
      ? charge.id
      : "";
  const paymentReference = checkoutId || chargeId;
  if (!paymentReference) {
    console.error("Bachs payment event is missing its charge and checkout IDs", { type });
    return NextResponse.json({ error: "Payment identifier is missing." }, { status: 400 });
  }

  try {
    const booking = reference
      ? await prisma.booking.findUnique({ where: { reference }, include: { package: true } })
      : await prisma.booking.findFirst({ where: { paystackRef: checkoutId }, include: { package: true } });
    if (!booking) {
      console.error("Bachs payment event did not match a booking", { type });
      return NextResponse.json({ error: "Booking not found." }, { status: 404 });
    }

    if (checkoutId && booking.paystackRef && booking.paystackRef !== checkoutId) {
      console.error("Bachs checkout ID did not match the booking", { type, bookingId: booking.id });
      return NextResponse.json({ error: "Checkout does not match the booking." }, { status: 409 });
    }
    if (booking.amount !== amount) {
      console.error("Bachs payment amount did not match the booking", {
        bookingId: booking.id,
        expectedAmount: booking.amount,
        receivedAmount: amount,
      });
      return NextResponse.json({ error: "Payment amount does not match the booking." }, { status: 409 });
    }
    if (booking.status === "CANCELLED" || booking.status === "FAILED") {
      console.error("Bachs reported payment for an inactive booking", { bookingId: booking.id, status: booking.status });
      return NextResponse.json({ error: "Booking is no longer active." }, { status: 409 });
    }

    const paidAt = typeof event.created_at === "string" && !Number.isNaN(Date.parse(event.created_at))
      ? new Date(event.created_at)
      : new Date();
    const paymentMethodDetails = isRecord(data.payment_method_details) ? data.payment_method_details : null;
    const channel = typeof paymentMethodDetails?.type === "string" ? paymentMethodDetails.type : "bachs";

    const paidBooking = await prisma.$transaction(async (transaction: Prisma.TransactionClient) => {
      const currentBooking = await transaction.booking.findUnique({ where: { id: booking.id } });
      if (!currentBooking) throw new Error("Booking disappeared during payment processing");
      if (currentBooking.status === "CANCELLED" || currentBooking.status === "FAILED") {
        throw new Error("Booking is no longer active");
      }

      await transaction.booking.update({
        where: { id: booking.id },
        data: {
          status: currentBooking.status === "PENDING" ? "PAID" : currentBooking.status,
          paymentMethod: "bachs",
          amountPaid: amount,
        },
      });
      await transaction.payment.upsert({
        where: { paystackRef: `bachs:${paymentReference}` },
        create: {
          bookingId: booking.id,
          amount,
          channel,
          paystackRef: `bachs:${paymentReference}`,
          status: "success",
          paidAt,
        },
        update: {},
      });
      return transaction.booking.findUnique({
        where: { id: booking.id },
        include: { package: true },
      });
    });

    if (!paidBooking) {
      console.error("Paid booking could not be loaded after transaction", { bookingId: booking.id });
      return NextResponse.json({ error: "Payment could not be recorded." }, { status: 500 });
    }

    if (process.env.RESEND_API_KEY && !paidBooking.emailSent) {
      const emailClaim = await prisma.booking.updateMany({
        where: { id: paidBooking.id, emailSent: false },
        data: { emailSent: true },
      });
      if (emailClaim.count > 0) {
        try {
          await sendBookingConfirmationEmail(paidBooking);
        } catch (error) {
          await prisma.booking.updateMany({
            where: { id: paidBooking.id, emailSent: true },
            data: { emailSent: false },
          });
          console.error("Bachs booking confirmation email failed:", error);
          return NextResponse.json({ error: "Booking confirmation could not be sent." }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ received: true, paid: true });
  } catch (error) {
    console.error("Bachs webhook processing failed:", error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }
}
