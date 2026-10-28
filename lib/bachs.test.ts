import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { parseNgnAmount, verifyBachsWebhookSignature } from "./bachs";

function sign(body: string, timestamp: string, secret: string) {
  return createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

test("parses whole-naira decimal amounts without treating them as minor units", () => {
  assert.equal(parseNgnAmount("1500"), 1500);
  assert.equal(parseNgnAmount("1500.00"), 1500);
  assert.equal(parseNgnAmount("0.00"), 0);
  assert.equal(parseNgnAmount("1500.50"), null);
  assert.equal(parseNgnAmount(1500), null);
  assert.equal(parseNgnAmount("1e3"), null);
});

test("verifies Bachs V2 signatures, including secret rotation signatures", () => {
  const body = '{"type":"collection.succeeded"}';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = sign(body, timestamp, "current-signing-secret");
  const oldSignature = sign(body, timestamp, "previous-signing-secret");
  const headers = new Headers({
    "x-bachs-signature-v2": `t=${timestamp},v1=${oldSignature},v1=${signature}`,
  });

  assert.equal(verifyBachsWebhookSignature(body, headers, "current-signing-secret"), true);
  assert.equal(verifyBachsWebhookSignature(`${body} `, headers, "current-signing-secret"), false);
});

test("rejects stale signatures and supports the legacy signature headers", () => {
  const body = '{"type":"collection.succeeded"}';
  const secret = "signing-secret";
  const staleTimestamp = String(Math.floor(Date.now() / 1000) - 301);
  const staleHeaders = new Headers({
    "x-bachs-signature-v2": `t=${staleTimestamp},v1=${sign(body, staleTimestamp, secret)}`,
  });
  assert.equal(verifyBachsWebhookSignature(body, staleHeaders, secret), false);

  const timestamp = String(Math.floor(Date.now() / 1000));
  const legacyHeaders = new Headers({
    "x-bachs-timestamp": timestamp,
    "x-bachs-signature": sign(body, timestamp, secret),
  });
  assert.equal(verifyBachsWebhookSignature(body, legacyHeaders, secret), true);
  assert.equal(verifyBachsWebhookSignature(body, legacyHeaders, ""), false);
});
