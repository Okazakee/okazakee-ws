/**
 * Per-IP submission throttle for the public intake endpoint.
 *
 * In-process by design: the endpoint is anonymous and needs no new
 * infrastructure, and a bound that is per-instance still caps what a single
 * visitor can push through one instance. It is an abuse-and-cost bound, not
 * an authorization control — the storage decision (service role, no anon
 * grant) is what protects the table.
 */
import { requestRateLimit } from '@/config/requests';

type Bucket = { tokens: number; lastRefill: number };

// Buckets are tiny and bounded; stale entries are swept on access so a flood
// of one-shot IPs cannot grow the map without limit.
const buckets = new Map<string, Bucket>();
const MAX_TRACKED_IPS = 10_000;

export function allowRequest(key: string, now: number = Date.now()): boolean {
  const bucket = buckets.get(key);
  // Divide by the interval rather than multiplying by its reciprocal:
  // `1/1800000` is not representable in binary floating point, so
  // `elapsed * (1 / refillIntervalMs)` lands a full interval at
  // 0.9999999999999999 tokens and a visitor who waited the whole refill
  // period is still refused.

  if (bucket === undefined) {
    if (buckets.size >= MAX_TRACKED_IPS) sweep(now);
    // An untracked IP still gets its first burst budget, tracked from now on.
    buckets.set(key, {
      tokens: requestRateLimit.maxTokens - 1,
      lastRefill: now,
    });
    return true;
  }

  const elapsed = Math.max(0, now - bucket.lastRefill);
  bucket.tokens = Math.min(
    requestRateLimit.maxTokens,
    bucket.tokens + elapsed / requestRateLimit.refillIntervalMs
  );
  bucket.lastRefill = now;

  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (
      bucket.tokens < requestRateLimit.maxTokens &&
      now - bucket.lastRefill < requestRateLimit.refillIntervalMs
    ) {
      continue;
    }
    buckets.delete(key);
  }
}

/** Test seam: drops all tracked state between cases. */
export function resetRequestThrottle(): void {
  buckets.clear();
}
