/**
 * Linear webhook signature verification.
 * Constant-time HMAC-SHA256 comparison.
 *
 * Reference: https://linear.app/developers/webhooks
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyOptions {
  /** Maximum age of a webhook event in milliseconds (replay protection). Default 5 min. */
  maxAgeMs?: number;
}

export interface VerifyResult {
  ok: boolean;
  reason?: "bad_signature" | "stale_timestamp" | "malformed_body";
}

/**
 * Verify a Linear webhook delivery.
 *
 * @param rawBody  the raw body bytes (Buffer); MUST be the unparsed body
 * @param signatureHex  the value of the `Linear-Signature` header
 * @param secret  the webhook secret configured at registration
 * @param now  current time in ms (overridable for tests)
 * @param opts.maxAgeMs  reject events older than this (default 5 min)
 */
export function verifyLinearWebhook(
  rawBody: Buffer,
  signatureHex: string | null | undefined,
  secret: string,
  now: number = Date.now(),
  opts: VerifyOptions = {}
): VerifyResult {
  if (!signatureHex || !rawBody?.length) return { ok: false, reason: "malformed_body" };

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  let a: Buffer, b: Buffer;
  try {
    a = Buffer.from(signatureHex, "hex");
    b = Buffer.from(expected, "hex");
  } catch {
    return { ok: false, reason: "bad_signature" };
  }
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  let parsed: { webhookTimestamp?: number };
  try {
    parsed = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return { ok: false, reason: "malformed_body" };
  }
  const ts = parsed.webhookTimestamp;
  const max = opts.maxAgeMs ?? 5 * 60_000;
  if (typeof ts === "number" && Math.abs(now - ts) > max) {
    return { ok: false, reason: "stale_timestamp" };
  }
  return { ok: true };
}
