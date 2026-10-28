import { Resend } from "resend";

type BookingConfirmation = {
  id: string;
  reference: string;
  customerName: string;
  email: string;
  amount: number;
  package?: { label: string } | null;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export async function sendBookingConfirmationEmail(booking: BookingConfirmation) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM ?? "The Helm Space <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://thehelmspace.com";
  const formatNaira = (amount: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amount);

  const name = escapeHtml(booking.customerName || "there");
  const id = escapeHtml(booking.id);
  const reference = escapeHtml(booking.reference);
  const packageLabel = escapeHtml(booking.package?.label ?? "Coworking Space");
  const logoUrl = `${appUrl.replace(/\/$/, "")}/THS-LOGO.png`;
  const html = `<!doctype html><html lang="en"><body style="margin:0;padding:32px;background:#f5f4f2;font-family:Arial,sans-serif;color:#141414"><main style="max-width:560px;margin:auto;background:#fff;border:1px solid #ebebeb;border-radius:16px;overflow:hidden"><header style="padding:24px;background:#141414;border-bottom:2px solid #f1552b"><img src="${logoUrl}" alt="The Helm Space" height="38"></header><section style="padding:32px"><h1 style="font-size:24px;margin:0 0 12px">Booking confirmed</h1><p>Hi ${name}, your payment was received and your booking is confirmed.</p><p><strong>Booking ID:</strong> ${id}</p><p><strong>Reference:</strong> ${reference}</p><p><strong>Package:</strong> ${packageLabel}</p><p><strong>Amount paid:</strong> ${formatNaira(booking.amount)}</p><p>Show your booking reference at the front desk when you arrive.</p></section><footer style="padding:20px 32px;background:#f8f7f5;color:#777;font-size:12px">The Helm Space · Nasarawa, Nigeria</footer></main></body></html>`;

  const { error } = await resend.emails.send({
    from,
    to: [booking.email],
    subject: `Booking Confirmed — ${booking.id} | The Helm Space`,
    html,
  });
  if (error) throw new Error(`Booking confirmation email failed: ${error.message}`);
}
