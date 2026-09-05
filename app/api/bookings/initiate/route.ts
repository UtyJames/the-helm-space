import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateRef() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return "THS-" + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  try {
    const { packageId, dates, amount, customerName, email, phone } = await req.json();

    if (!packageId || !customerName || !email || !phone || !amount) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Lookup package by ID or key
    const pkg = await prisma.package.findFirst({
      where: {
        OR: [{ id: packageId }, { key: packageId }],
      },
    });

    if (!pkg) {
      return NextResponse.json({ error: "Selected package not found." }, { status: 400 });
    }

    const reference = generateRef();

    // Create a PENDING booking
    const booking = await prisma.booking.create({
      data: {
        reference,
        customerName,
        email,
        phone,
        packageId: pkg.id,
        dates: dates ? (typeof dates === "string" ? dates : JSON.stringify(dates)) : null,
        amount,
        status: "PENDING",
      },
    });

    // Initialize Paystack transaction
    const paystackSecret = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecret) {
      console.error("PAYSTACK_SECRET_KEY is not configured in .env");
      return NextResponse.json({ error: "Payment gateway not configured" }, { status: 500 });
    }

    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const originUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // kobo
        reference,
        callback_url: `${originUrl}/book/success?ref=${reference}`,
        metadata: {
          bookingId: booking.id,
          customerName,
          packageId: pkg.id,
          packageLabel: pkg.label,
        },
      }),
    });

    if (!paystackRes.ok) {
      const err = await paystackRes.json();
      console.error("Paystack error:", err);
      return NextResponse.json({ error: err?.message || "Payment provider error. Please try again." }, { status: 502 });
    }

    const { data } = await paystackRes.json();

    // Store the Paystack reference on the booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paystackRef: reference },
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
      reference,
      authorizationUrl: data.authorization_url,
      accessCode: data.access_code,
    });
  } catch (err) {
    console.error("Booking initiate error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
