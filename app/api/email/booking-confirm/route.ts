import { NextResponse } from "next/server";
import { Resend } from "resend";
import fs from "fs";
import path from "path";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "The Helm Space <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://thehelmspace.com";

function getLogoAttachment() {
  try {
    const pngPath = path.join(process.cwd(), "public", "THS-LOGO.png");
    if (fs.existsSync(pngPath)) {
      return {
        filename: "ths-logo.png",
        content: fs.readFileSync(pngPath),
        cid: "thslogo",
      };
    }
  } catch (err) {
    console.warn("Could not read logo PNG:", err);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { to, name, bookingId, reference, packageName, amount, dates, phone } = await req.json();
    if (!to || !bookingId) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const N = (n: number) => new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(n);
    const logoAttachment = getLogoAttachment();
    const logoSrc = logoAttachment ? "cid:thslogo" : `${APP_URL}/THS-LOGO.png`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Booking Confirmation — The Helm Space</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #ebebeb;">
        <!-- Header -->
        <tr>
          <td style="background:#141414;padding:28px 40px;border-bottom:2px solid #f1552b;">
            <img src="${logoSrc}" alt="The Helm Space" height="38" style="display:block;height:38px;max-height:38px;width:auto;border:0;outline:none;" />
          </td>
        </tr>
        <!-- Hero -->
        <tr>
          <td style="padding:40px 40px 0;text-align:center;">
            <div style="width:56px;height:56px;background:rgba(241,85,43,0.1);border:1px solid rgba(241,85,43,0.25);border-radius:50%;margin:0 auto 16px;text-align:center;line-height:56px;">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#f1552b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#141414;font-family:Georgia,serif;">Booking Confirmed</h1>
            <p style="margin:0;font-size:15px;color:#666;">Hi ${name ?? "there"}, your booking at The Helm Space is confirmed.</p>
          </td>
        </tr>
        <!-- Booking ID prominent -->
        <tr>
          <td style="padding:24px 40px;">
            <div style="background:#141414;border-radius:16px;padding:24px;text-align:center;border:1px solid #262626;">
              <p style="margin:0 0 6px;font-size:11px;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:2px;font-family:monospace;">Your Booking ID</p>
              <p style="margin:0;font-size:22px;font-weight:700;color:#f1552b;font-family:monospace;letter-spacing:1px;">${bookingId}</p>
              <p style="margin:8px 0 0;font-size:11px;color:rgba(255,255,255,0.4);">Present this ID upon arrival at the front desk</p>
            </div>
          </td>
        </tr>
        <!-- Details -->
        <tr>
          <td style="padding:0 40px 32px;">
            <p style="margin:0 0 16px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:2px;font-family:monospace;">Booking Details</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${[
                ["Reference", reference ?? "—"],
                ["Package", packageName ?? "—"],
                ["Amount Paid", N(amount ?? 0)],
                ...(dates ? [["Dates", dates]] : []),
                ...(phone ? [["Phone", phone]] : []),
              ].map(([label, value]) => `
              <tr>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
                  <span style="font-size:12px;color:#999;">${label}</span>
                </td>
                <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
                  <span style="font-size:13px;font-weight:600;color:#141414;">${value}</span>
                </td>
              </tr>`).join("")}
            </table>
          </td>
        </tr>
        <!-- Info box -->
        <tr>
          <td style="padding:0 40px 32px;">
            <div style="background:#fef9f7;border:1px solid rgba(241,85,43,0.2);border-radius:12px;padding:20px;">
              <div style="margin-bottom:8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1552b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;margin-right:6px;">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span style="font-size:13px;font-weight:700;color:#f1552b;letter-spacing:0.5px;text-transform:uppercase;font-family:Inter,Arial,sans-serif;">Check-In Instructions</span>
              </div>
              <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">
                Please present your <strong>Booking ID</strong> (${bookingId}) at the front desk upon arrival. Ensure to arrive on time for a seamless check-in experience.
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f7f5;padding:24px 40px;text-align:center;border-top:1px solid #ebebeb;">
            <p style="margin:0 0 4px;font-size:12px;color:#999;font-weight:600;">The Helm Space · Nasarawa, Nigeria</p>
            <p style="margin:0;font-size:11px;color:#bbb;">This is an automated confirmation email. Please keep this for your records.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `Booking Confirmed — ${bookingId} | The Helm Space`,
      html,
      attachments: logoAttachment ? [logoAttachment] : undefined,
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Email failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Email route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
