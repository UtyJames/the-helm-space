import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import fs from "fs";
import path from "path";
import { verifyBachsCheckout, isPaidStatus } from "@/lib/bachs";

function getLogoAttachment() {
  try {
    const pngPath = path.join(process.cwd(), "public", "THS-LOGO.png");
    if (fs.existsSync(pngPath)) return { filename: "ths-logo.png", content: fs.readFileSync(pngPath), cid: "thslogo" };
  } catch {}
  return null;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("reference") ?? url.searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Reference required" }, { status: 400 });

  try {
    const bachsData = await verifyBachsCheckout(ref);
    const r = isPaidStatus(bachsData);
    if (!r.paid) {
      return NextResponse.json({ error: "Payment not yet confirmed", status: (bachsData as Record<string, unknown>)?.status ?? "pending" }, { status: 400 });
    }

    const booking = await prisma.booking.update({
      where: { reference: ref },
      data: { status: "PAID", paymentMethod: "bachs" },
      include: { package: true },
    });

    const amountNgn =
      typeof r.amount === "number" ? (r.amount > 10000 ? Math.round(r.amount / 100) : Math.round(r.amount)) : booking.amount;

    await prisma.payment.upsert({
      where: { paystackRef: ref },
      create: {
        bookingId: booking.id,
        amount: amountNgn,
        channel: r.channel ?? "bachs",
        paystackRef: ref,
        status: "success",
        paidAt: r.paidAt ? new Date(r.paidAt) : new Date(),
      },
      update: {},
    });

    if (process.env.RESEND_API_KEY && booking.email) {
      try {
        await sendConfirmationEmail(booking);
      } catch (e) {
        console.error("Email send failed:", e);
      }
    }
    return NextResponse.json({ success: true, booking, payment: bachsData, provider: "bachs" });
  } catch (err) {
    console.error("Verify error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg || "Server error during payment verification" }, { status: 500 });
  }
}

async function sendConfirmationEmail(booking: { id: string; reference: string; customerName: string; email: string; amount: number; package?: { label: string } | null }) {
  const resend = new Resend(process.env.RESEND_API_KEY!);
  const FROM = process.env.RESEND_FROM ?? "The Helm Space <onboarding@resend.dev>";
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://thehelmspace.com";
  const N = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
  const logoAttachment = getLogoAttachment();
  const logoSrc = logoAttachment ? "cid:thslogo" : `${APP_URL}/THS-LOGO.png`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>Booking Confirmation — The Helm Space</title></head><body style="margin:0;padding:0;background:#f5f4f2;font-family:Inter,Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #ebebeb;"><tr><td style="background:#141414;padding:28px 40px;border-bottom:2px solid #f1552b;"><img src="${logoSrc}" alt="The Helm Space" height="38" style="display:block;height:38px;"/></td></tr><tr><td style="padding:40px 40px 0;text-align:center;"><div style="width:56px;height:56px;background:rgba(241,85,43,0.1);border:1px solid rgba(241,85,43,0.25);border-radius:50%;margin:0 auto 16px;text-align:center;line-height:56px;"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f1552b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;"><polyline points="20 6 9 17 4 12"></polyline></svg></div><h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141414;font-family:Georgia,serif;">Booking Confirmed</h1><p style="margin:0;font-size:15px;color:#666;">Hi ${booking.customerName ?? "there"}, your booking at The Helm Space is confirmed.</p></td></tr><tr><td style="padding:24px 40px;"><div style="background:#141414;border-radius:16px;padding:24px;text-align:center;border:1px solid #262626;"><p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;font-family:monospace;">Your Booking ID</p><p style="margin:0;font-size:22px;font-weight:700;color:#f1552b;font-family:monospace;letter-spacing:1px;">${booking.id}</p></div></td></tr><tr><td style="padding:0 40px 32px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#999;">Reference</span></td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#141414;">${booking.reference}</span></td></tr><tr><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;"><span style="font-size:12px;color:#999;">Package</span></td><td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#141414;">${booking.package?.label ?? "Coworking Space"}</span></td></tr><tr><td style="padding:12px 0;"><span style="font-size:12px;color:#999;">Amount Paid</span></td><td style="padding:12px 0;text-align:right;"><span style="font-size:13px;font-weight:600;color:#141414;">${N(booking.amount)}</span></td></tr></table></td></tr><tr><td style="background:#f8f7f5;padding:24px 40px;text-align:center;border-top:1px solid #ebebeb;"><p style="margin:0;font-size:12px;color:#999;font-weight:600;">The Helm Space · Nasarawa, Nigeria</p></td></tr></table></td></tr></table></body></html>`;
  await resend.emails.send({ from: FROM, to: [booking.email], subject: `Booking Confirmed — ${booking.id} | The Helm Space`, html, attachments: logoAttachment ? [logoAttachment] : undefined });
}
