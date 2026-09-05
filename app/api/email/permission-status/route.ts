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
    const { to, name, status, dateFrom, dateTill, reason } = await req.json();
    if (!to) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    const isApproved = status === "APPROVED";
    const logoAttachment = getLogoAttachment();
    const logoSrc = logoAttachment ? "cid:thslogo" : `${APP_URL}/THS-LOGO.png`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Permission ${isApproved ? "Approved" : "Declined"} — The Helm Space</title>
</head>
<body style="margin:0;padding:0;background:#f5f4f2;font-family:Inter,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f2;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:white;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #ebebeb;">
        <!-- Header -->
        <tr>
          <td style="background:#141414;padding:28px 36px;border-bottom:2px solid ${isApproved ? "#10b981" : "#ef4444"};">
            <img src="${logoSrc}" alt="The Helm Space" height="36" style="display:block;height:36px;max-height:36px;width:auto;border:0;outline:none;" />
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px;text-align:center;">
            <div style="width:56px;height:56px;background:${isApproved ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)"};border:1px solid ${isApproved ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"};border-radius:50%;margin:0 auto 16px;text-align:center;line-height:56px;">
              ${isApproved ? `
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>` : `
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:middle;">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>`}
            </div>
            <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:#141414;">
              Permission ${isApproved ? "Approved" : "Declined"}
            </h1>
            <p style="margin:0 0 28px;font-size:14px;color:#666;">
              Hi ${name ?? "there"}, your permission request has been <strong style="color:${isApproved ? "#10b981" : "#ef4444"}">${isApproved ? "approved" : "declined"}</strong>.
            </p>
            <div style="background:#f8f7f5;border-radius:12px;padding:20px;text-align:left;margin-bottom:24px;border:1px solid #eee;">
              <p style="margin:0 0 6px;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1.5px;font-family:monospace;">Request Details</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding:8px 0;border-bottom:1px solid #ebebeb;font-size:12px;color:#999;">Reason</td>
                    <td style="padding:8px 0;border-bottom:1px solid #ebebeb;font-size:13px;font-weight:600;color:#141414;text-align:right;">${reason}</td></tr>
                <tr><td style="padding:8px 0;border-bottom:1px solid #ebebeb;font-size:12px;color:#999;">From</td>
                    <td style="padding:8px 0;border-bottom:1px solid #ebebeb;font-size:13px;font-weight:600;color:#141414;text-align:right;">${fmt(dateFrom)}</td></tr>
                <tr><td style="padding:8px 0;font-size:12px;color:#999;">To</td>
                    <td style="padding:8px 0;font-size:13px;font-weight:600;color:#141414;text-align:right;">${fmt(dateTill)}</td></tr>
              </table>
            </div>
            ${!isApproved ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;text-align:left;">
              <p style="margin:0;font-size:13px;color:#dc2626;">Your request was not approved. Please reach out to the management team for further clarification.</p>
            </div>` : ""}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8f7f5;padding:20px 36px;text-align:center;border-top:1px solid #ebebeb;">
            <p style="margin:0;font-size:11px;color:#bbb;">The Helm Space · Automated Notification</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const { error } = await resend.emails.send({
      from: FROM,
      to: [to],
      subject: `Permission ${isApproved ? "Approved" : "Declined"} — The Helm Space`,
      html,
      attachments: logoAttachment ? [logoAttachment] : undefined,
    });

    if (error) return NextResponse.json({ error: "Email failed" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
