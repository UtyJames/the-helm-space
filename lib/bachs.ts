export function bachsBaseUrl() {
  return (process.env.BACHS_API_URL ?? "https://api.bachs.io").replace(/\/$/, "");
}

export function bachsSecret() {
  return process.env.BACHS_SECRET_KEY ?? process.env.BACHS_API_KEY ?? "";
}

export function bachsWebhookSecret() {
  return process.env.BACHS_WEBHOOK_SECRET ?? process.env.BACHS_SECRET_KEY ?? "";
}

export async function createBachsCheckout(params: {
  reference: string;
  amount: number;
  currency?: string;
  email: string;
  customerName: string;
  packageLabel: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const secret = bachsSecret();
  if (!secret) throw new Error("BACHS_SECRET_KEY not configured");
  const base = bachsBaseUrl();
  const url = `${base}/v1/checkout-sessions`;

  // Bachs expects decimal string amounts like "5000.00"
  const amountStr = Number(params.amount).toFixed(2);

  const body: Record<string, unknown> = {
    // Bachs requires exactly ONE pricing source: use "pricing" (inline amount)
    pricing: {
      amount: amountStr,
      currency: params.currency ?? "NGN",
    },
    reference: params.reference,
    customer: { email: params.email, name: params.customerName },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      reference: params.reference,
      packageId: params.packageId,
      packageLabel: params.packageLabel,
      ...(params.metadata ?? {}),
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const rawText = await res.text();
  let json: Record<string, unknown> = {};
  try { json = JSON.parse(rawText); } catch { json = { raw: rawText }; }
  if (!res.ok) {
    const detail = JSON.stringify(json).slice(0, 4000);
    console.error("Bachs checkout 400 body:", detail, " sent:", JSON.stringify(body).slice(0, 2000));
    const msg = (json as Record<string, unknown>).message ?? (json as Record<string, unknown>).error ?? (json as Record<string, unknown>).detail ?? `Bachs checkout failed (${res.status})`;
    throw new Error(typeof msg === "string" ? `${msg} :: ${detail}` : `Bachs checkout failed (${res.status}) :: ${detail}`);
  }
  // Hosted URL variants across Bachs versions: checkout_url, url, hosted_url
  const d = (json as Record<string, unknown>);
  const nested = (d?.data as Record<string, unknown>) ?? d;
  const checkoutUrl: string | undefined =
    (nested?.checkout_url as string) ?? (nested?.url as string) ?? (nested?.hosted_url as string) ?? (d?.checkout_url as string) ?? (d?.url as string);
  const checkoutId: string | undefined =
    (nested?.id as string) ?? (nested?.checkout_id as string) ?? (d?.id as string) ?? (d?.checkout_id as string);
  if (!checkoutUrl) throw new Error("Bachs did not return a checkout URL");
  return { checkoutUrl, checkoutId: checkoutId ?? params.reference, raw: json };
}

export async function verifyBachsCheckout(checkoutIdOrRef: string) {
  const secret = bachsSecret();
  if (!secret) throw new Error("BACHS_SECRET_KEY not configured");
  const base = bachsBaseUrl();
  // Try by id then by reference
  const candidates = [
    `${base}/v1/checkout-sessions/${encodeURIComponent(checkoutIdOrRef)}`,
    `${base}/v1/checkouts/${encodeURIComponent(checkoutIdOrRef)}`,
    `${base}/v1/payments/${encodeURIComponent(checkoutIdOrRef)}`,
  ];
  let lastErr: unknown = null;
  for (const u of candidates) {
    const r = await fetch(u, { headers: { Authorization: `Bearer ${secret}` } });
    const j = await r.json().catch(() => ({}));
    if (r.ok && (j?.data || j?.status || j?.id)) return j?.data ?? j;
    lastErr = j;
  }
  throw new Error((lastErr as { message?: string })?.message ?? "Bachs verification failed");
}

export function isPaidStatus(data: unknown): { paid: boolean; channel?: string; amount?: number; paidAt?: string } {
  const d = data as Record<string, unknown>;
  const status = String(d?.status ?? d?.state ?? "").toLowerCase();
  const paid = ["paid", "succeeded", "success", "completed", "captured"].includes(status);
  const nested = (d?.data as Record<string, unknown>) ?? d;
  const nStatus = String(nested?.status ?? "").toLowerCase();
  const nPaid = ["paid", "succeeded", "success", "completed"].includes(nStatus);
  return {
    paid: paid || nPaid || status === "paid",
    channel: String(d?.channel ?? nested?.channel ?? "bachs"),
    amount: typeof nested?.amount === "number" ? nested.amount : typeof d?.amount === "number" ? d.amount : undefined,
    paidAt: String(nested?.paid_at ?? d?.paid_at ?? d?.paidAt ?? ""),
  };
}
