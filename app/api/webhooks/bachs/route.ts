import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function verifySignature(rawBody: string, timestamp: string, signature: string, secret: string): boolean {
  // Bachs signs HMAC-SHA256 over "{timestamp}.{rawBody}" hex digest
  const payload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  // Also try without timestamp prefix (some versions sign rawBody only)
  const expectedRaw = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const sig = signature.replace(/^sha256=/, "");
  try {
    if (sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return true;
    if (sig.length === expectedRaw.length && crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expectedRaw, "hex"))) return true;
  } catch {}
  return sig === expected || sig === expectedRaw;
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-bachs-signature") ?? req.headers.get("x-bachs-signature-256") ?? "";
  const timestamp = req.headers.get("x-bachs-timestamp") ?? "";
  const secret = process.env.BACHS_WEBHOOK_SECRET ?? process.env.BACHS_SECRET_KEY ?? "";

  // If secret configured, enforce signature
  if (secret && signature) {
    if (!verifySignature(rawBody, timestamp, signature, secret)) {
      console.warn("Bachs webhook: invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } else if (secret && !signature) {
    console.warn("Bachs webhook: missing signature header");
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = String((body as Record<string, unknown>).type ?? (body as Record<string, unknown>).event ?? "").toLowerCase();
  const data = ((body as Record<string, unknown>).data ?? body) as Record<string, unknown>;
  const reference =
    String(data?.reference ?? data?.metadata_reference ?? (data?.metadata as Record<string, unknown>)?.reference ?? "") ||
    String((body as Record<string, unknown>).reference ?? "");

  // Only handle payment success events
  const successEvents = ["collection.succeeded", "checkout.completed", "payment.succeeded", "payment.paid", "charge.succeeded", "transaction.success"];
  const isSuccess = successEvents.some((e) => type.includes(e.split(".")[0]) && type.includes("succeed")) || type.includes("completed") || type.includes("succeeded");
  // Also accept explicit status field
  const status = String(data?.status ?? "").toLowerCase();
  const isPaidStatus = ["paid", "succeeded", "success", "completed"].includes(status);

  if (!isSuccess && !isPaidStatus && type) {
    // Acknowledge but ignore non-success events
    return NextResponse.json({ received: true, ignored: type });
  }

  if (!reference) {
    console.warn("Bachs webhook: no reference in payload", { type });
    return NextResponse.json({ received: true, warning: "no reference" });
  }

  try {
    const booking = await prisma.booking.findUnique({ where: { reference } });
    if (!booking) {
      console.warn("Bachs webhook: booking not found for reference", reference);
      return NextResponse.json({ received: true, warning: "booking not found" });
    }
    if (booking.status === "PAID") {
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    await prisma.booking.update({ where: { reference }, data: { status: "PAID", paymentMethod: "bachs" } });

    const amountRaw = data?.amount;
    const amountNgn =
      typeof amountRaw === "number" ? (amountRaw > 10000 ? Math.round(amountRaw / 100) : Math.round(amountRaw)) : booking.amount;
    const paystackRef = String(data?.id ?? data?.checkout_id ?? reference);

    await prisma.payment.upsert({
      where: { paystackRef },
      create: {
        bookingId: booking.id,
        amount: amountNgn,
        channel: String(data?.channel ?? "bachs"),
        paystackRef,
        status: "success",
        paidAt: data?.paid_at ? new Date(String(data.paid_at)) : new Date(),
      },
      update: {},
    });

    return NextResponse.json({ received: true, paid: true });
  } catch (e) {
    console.error("Bachs webhook error:", e);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
