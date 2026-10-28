import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createBachsCheckout } from "@/lib/bachs";

function generateRef() {
  return `THS-${randomBytes(6).toString("hex").toUpperCase()}`;
}

function isValidBookingDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getOrigin(req: Request) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl && !appUrl.includes("localhost")) return appUrl.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const isLocal = !host || host.includes("localhost") || host.includes("127.0.0.1");
  if (!isLocal && host) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    return `${proto}://${host}`;
  }
  // Bachs requires a publicly accessible URL — never send localhost
  if (appUrl && appUrl.includes("localhost")) {
    // In local dev, fall back to deployed domain so Bachs accepts the request
    return "https://thehelmspace.com";
  }
  return (appUrl ?? "https://thehelmspace.com").replace(/\/$/, "");
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  let bookingId: string | undefined;
  try {
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const input = body as Record<string, unknown>;
    const packageId = typeof input.packageId === "string" ? input.packageId : "";
    const customerName = typeof input.customerName === "string" ? input.customerName.trim() : "";
    const email = typeof input.email === "string" ? input.email.trim() : "";
    const phone = typeof input.phone === "string" ? input.phone.trim() : "";
    if (!packageId || !customerName || customerName.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !phone || phone.length > 50) {
      return NextResponse.json({ error: "Enter a valid name, email, and phone number." }, { status: 400 });
    }

    const pkg = await prisma.package.findFirst({
      where: { active: true, OR: [{ id: packageId }, { key: packageId }] },
    });
    if (!pkg) return NextResponse.json({ error: "Selected package not found." }, { status: 400 });

    let dates: string[] = [];
    let quantity: number;
    if (pkg.custom) {
      if (!Array.isArray(input.dates) || input.dates.length < 1 || input.dates.length > 30) {
        return NextResponse.json({ error: "Select between 1 and 30 booking dates." }, { status: 400 });
      }
      if (input.dates.some((date) => !isValidBookingDate(date))) {
        return NextResponse.json({ error: "One or more booking dates are invalid." }, { status: 400 });
      }
      dates = [...new Set(input.dates as string[])];
      if (dates.length !== input.dates.length) {
        return NextResponse.json({ error: "Booking dates must be unique." }, { status: 400 });
      }
      quantity = dates.length;
    } else {
      quantity = input.quantity === undefined ? 1 : Number(input.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 30) {
        return NextResponse.json({ error: "Quantity must be between 1 and 30." }, { status: 400 });
      }
    }

    const amount = pkg.price * quantity;

    const reference = generateRef();

    const booking = await prisma.booking.create({
      data: {
        reference,
        customerName,
        email,
        phone,
        packageId: pkg.id,
        dates: dates.length > 0 ? JSON.stringify(dates) : null,
        amount,
        status: "PENDING",
        notes: `qty:${quantity}`,
      },
    });
    bookingId = booking.id;

    const originUrl = getOrigin(req);
    const { checkoutUrl, checkoutId } = await createBachsCheckout({
      reference,
      amount,
      email,
      customerName,
      packageLabel: pkg.label,
      packageId: pkg.id,
      successUrl: `${originUrl}/book/success?ref=${reference}`,
      cancelUrl: `${originUrl}/book?cancelled=1`,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paystackRef: checkoutId, paymentMethod: "bachs" },
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      reference,
      checkoutUrl,
      authorizationUrl: checkoutUrl,
      provider: "bachs",
    });
  } catch (err) {
    if (bookingId) {
      try {
        await prisma.booking.update({ where: { id: bookingId }, data: { status: "FAILED" } });
      } catch (updateError) {
        console.error("Could not mark failed Bachs booking", updateError);
      }
    }
    const message = err instanceof Error ? err.message : "Unexpected checkout error";
    console.error("Bachs checkout error:", message);
    const isConfig = message.includes("BACHS_SECRET_KEY");
    return NextResponse.json(
      { error: isConfig ? "Payment gateway is not configured." : "Unable to start checkout. Please try again." },
      { status: 502 },
    );
  }
}
