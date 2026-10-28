import { createHmac, timingSafeEqual } from "node:crypto";

export function bachsBaseUrl() {
  const configuredUrl = process.env.BACHS_API_URL;
  if (configuredUrl) return configuredUrl.replace(/\/+$/, "");

  return bachsSecret().startsWith("sk_sandbox_")
    ? "https://sandbox-api.bachs.io"
    : "https://api.bachs.io";
}

export function bachsSecret() {
  return process.env.BACHS_SECRET_KEY ?? process.env.BACHS_API_KEY ?? "";
}

export function bachsWebhookSecret() {
  return process.env.BACHS_WEBHOOK_SECRET ?? "";
}

export function parseNgnAmount(amount: unknown): number | null {
  if (typeof amount !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(amount)) return null;

  const [whole, fraction = ""] = amount.split(".");
  const kobo = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(kobo) || kobo % 100 !== 0) return null;
  return kobo / 100;
}

function signatureMatches(rawBody: string, timestamp: string, signatures: string[], secret: string) {
  const expected = createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest();
  return signatures.some((signature) => {
    if (!/^[\da-f]{64}$/i.test(signature)) return false;
    const supplied = Buffer.from(signature, "hex");
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}

export function verifyBachsWebhookSignature(rawBody: string, headers: Headers, secret: string, now = Date.now()) {
  if (!secret) return false;

  const signatureV2 = headers.get("x-bachs-signature-v2");
  let timestamp: string | null = null;
  let signatures: string[] = [];

  if (signatureV2) {
    for (const part of signatureV2.split(",")) {
      const [key, value] = part.trim().split("=", 2);
      if (key === "t") timestamp = value ?? null;
      if (key === "v1" && value) signatures.push(value);
    }
  } else {
    timestamp = headers.get("x-bachs-timestamp");
    const signature = headers.get("x-bachs-signature");
    if (signature) signatures = [signature];
  }

  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;
  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds) || Math.abs(now / 1000 - timestampSeconds) > 300) return false;

  return signatureMatches(rawBody, timestamp, signatures, secret);
}

export async function createBachsCheckout(params: {
  reference: string;
  amount: number;
  email: string;
  customerName: string;
  packageLabel: string;
  packageId: string;
  successUrl: string;
  cancelUrl: string;
}) {
  const secret = bachsSecret();
  if (!secret) throw new Error("BACHS_SECRET_KEY is not configured");

  const response = await fetch(`${bachsBaseUrl()}/v1/checkout-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      "Idempotency-Key": params.reference,
    },
    body: JSON.stringify({
      pricing: {
        amount: params.amount.toFixed(2),
        currency: "NGN",
      },
      reference: params.reference,
      customer: { email: params.email, name: params.customerName },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        reference: params.reference,
        packageId: params.packageId,
        packageLabel: params.packageLabel,
      },
    }),
  });

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    console.error("Bachs checkout request failed", {
      status: response.status,
      errorCode: typeof body.error_code === "string" ? body.error_code : undefined,
    });
    throw new Error("Unable to start checkout. Please try again.");
  }

  const checkout = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  if (typeof checkout.checkout_url !== "string" || typeof checkout.checkout_id !== "string") {
    throw new Error("Bachs returned an invalid checkout response");
  }

  return { checkoutUrl: checkout.checkout_url, checkoutId: checkout.checkout_id };
}
