import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBachsCheckout, bachsBaseUrl } from "@/lib/bachs";

function generateRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "THS-" + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

function getOrigin(req: Request) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");
}

export async function POST(req: Request) {
  try {
    const { packageId, dates, amount, quantity, customerName, email, phone } = await req.json();
    if (!packageId || !customerName || !email || !phone || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const pkg = await prisma.package.findFirst({ where: { OR: [{ id: packageId }, { key: packageId }] } });
    if (!pkg) return NextResponse.json({ error: "Selected package not found." }, { status: 400 });

    const reference = generateRef();
    const qty = typeof quantity === "number" && quantity >= 1 ? Math.min(30, quantity) : undefined;

    const booking = await prisma.booking.create({
      data: {
        reference,
        customerName,
        email,
        phone,
        packageId: pkg.id,
        dates: dates ? (typeof dates === "string" ? dates : JSON.stringify(dates)) : null,
        amount: Math.round(Number(amount)),
        status: "PENDING",
        notes: qty ? `qty:${qty}` : undefined,
      },
    });

    const originUrl = getOrigin(req);
    const { checkoutUrl, checkoutId } = await createBachsCheckout({
      reference,
      amount: Number(amount),
      currency: "NGN",
      email,
      customerName,
      packageLabel: pkg.label,
      packageId: pkg.id,
      successUrl: `${originUrl}/book/success?ref=${reference}`,
      cancelUrl: `${originUrl}/book?cancelled=1`,
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paystackRef: checkoutId ?? reference, paymentMethod: "bachs" },
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      reference,
      checkoutUrl,
      authorizationUrl: checkoutUrl,
      provider: "bachs",
      bachsBaseUrl: bachsBaseUrl(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Bachs checkout error:", msg);
    const isConfig = msg.includes("BACHS_SECRET_KEY") || msg.includes("not configured");
    return NextResponse.json({ error: isConfig ? "Payment gateway not configured (BACHS_SECRET_KEY missing)" : msg }, { status: 502 });
  }
}
