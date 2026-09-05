import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const body = await req.json();
    const {
      customerName,
      email,
      phone,
      packageId,
      dates,
      amount,
      paymentMethod = "CASH",
      amountPaid,
      changeGiven = 0,
      autoCheckIn = true,
      notes,
    } = body;

    if (!customerName || !email || !phone || !packageId || !amount) {
      return NextResponse.json({ error: "Name, email, phone, package, and amount are required." }, { status: 400 });
    }

    // Generate unique walk-in reference code: THS-W-XXXXXX
    const randomChars = Math.random().toString(36).substring(2, 8).toUpperCase();
    const reference = `THS-W-${randomChars}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        reference,
        customerName,
        email,
        phone,
        packageId,
        dates: dates || "Walk-In Onsite Access",
        amount: Number(amount),
        bookingType: "PHYSICAL",
        paymentMethod,
        amountPaid: amountPaid ? Number(amountPaid) : Number(amount),
        changeGiven: changeGiven ? Number(changeGiven) : 0,
        notes: notes || null,
        status: autoCheckIn ? "CHECKED_IN" : "PAID",
        checkedInAt: autoCheckIn ? new Date() : null,
        checkedInById: autoCheckIn ? userId : null,
      },
      include: {
        package: true,
        checkedInBy: { select: { name: true, username: true } },
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: Number(amount),
        channel: `WALK_IN_${paymentMethod}`,
        paystackRef: reference,
        status: "success",
        paidAt: new Date(),
      },
    });

    // Send confirmation email via Resend if API key is present
    if (process.env.RESEND_API_KEY && email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const FROM = process.env.RESEND_FROM ?? "The Helm Space <onboarding@resend.dev>";
        const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://thehelmspace.com";
        const N = (n: number) =>
          new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);

        const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Walk-In Booking Receipt — The Helm Space</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#141414;padding:32px 40px;">
            <img src="${APP_URL}/THS-LOGO.svg" alt="The Helm Space" height="40" style="display:block;"/>
          </td>
        </tr>
        <!-- Hero -->
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="width:60px;height:60px;background:rgba(241,85,43,0.1);border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:28px;">🏢</span>
            </div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141414;font-family:Georgia,serif;">Walk-In Booking Confirmed!</h1>
            <p style="margin:0;font-size:15px;color:#666;">Hi ${customerName}, your onsite walk-in booking at The Helm Space is confirmed.</p>
          </td>
        </tr>
        <!-- Booking ID prominent -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#141414;border-radius:16px;padding:24px;text-align:center;">
              <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:2px;font-family:monospace;">Your Booking ID</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#f1552b;font-family:monospace;letter-spacing:1px;">${booking.id}</p>
              <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.4);font-mono:monospace;">Ref: ${reference} · Walk-In</p>
            </div>
          </td>
        </tr>
        <!-- Details -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0 0 16px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:2px;font-family:monospace;">Receipt Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#999;">Package / Space</span></td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#141414;">${booking.package?.label ?? "Coworking Space"}</span></td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#999;">Amount Paid</span></td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#141414;">${N(booking.amount)}</span></td>
              </tr>
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#999;">Payment Method</span></td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#141414;">${paymentMethod}</span></td>
              </tr>
              ${amountPaid && changeGiven > 0 ? `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#999;">Tendered / Change</span></td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#141414;">${N(amountPaid)} (Change: ${N(changeGiven)})</span></td>
              </tr>` : ""}
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#999;">Status</span></td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#10b981;">Checked In / Active</span></td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Welcome note -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#fef9f7;border:1px solid rgba(241,85,43,0.2);border-radius:12px;padding:20px;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#f1552b;">☕ Welcome to The Helm Space!</p>
              <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
                Your onsite access is active. Enjoy high-speed Wi-Fi, premium coffee, power backup, and our dedicated workspaces. If you need any assistance, reach out to our front desk team.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f7f5;padding:24px 40px;text-align:center;border-top:1px solid #ebebeb;">
            <p style="margin:0 0 4px;font-size:12px;color:#999;">The Helm Space · Lagos, Nigeria</p>
            <p style="margin:0;font-size:11px;color:#bbb;">Thank you for choosing The Helm Space. Keep this email for your records.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

        await resend.emails.send({
          from: FROM,
          to: [email],
          subject: `Walk-In Booking Receipt — ${booking.id} | The Helm Space`,
          html,
        });

        await prisma.booking.update({
          where: { id: booking.id },
          data: { emailSent: true },
        });
      } catch (err) {
        console.error("Walk-in email dispatch error:", err);
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error("Walk-in booking creation failed:", error);
    return NextResponse.json({ error: "Failed to create walk-in booking." }, { status: 500 });
  }
}
