/**
 * Tiny in-process per-key token bucket.
 *
 * One implementation behind the anonymous endpoint budgets (project-request
 * intake, post search): no infrastructure, per-instance, a cost-and-abuse
 * bound rather than an authorization control.
 */
export type ThrottleBudget = {
  readonly maxTokens: number;
  readonly refillIntervalMs: number;
};

type Bucket = { tokens: number; lastRefill: number };

export function createThrottle(
  budget: ThrottleBudget,
  maxTrackedKeys = 10_000
): {
  allow: (key: string, now?: number) => boolean;
  reset: () => void;
} {
  // Buckets are tiny and bounded; stale entries are swept on access so a
  // flood of one-shot keys cannot grow the map without limit.
  const buckets = new Map<string, Bucket>();

  function sweep(now: number): void {
    for (const [key, bucket] of buckets) {
      if (
        bucket.tokens < budget.maxTokens &&
        now - bucket.lastRefill < budget.refillIntervalMs
      ) {
        continue;
      }
      buckets.delete(key);
    }
  }

  function allow(key: string, now: number = Date.now()): boolean {
    const bucket = buckets.get(key);
    // Divide by the interval rather than multiplying by its reciprocal:
    // `1/1800000` is not representable in binary floating point, so
    // `elapsed * (1 / refillIntervalMs)` lands a full interval at
    // 0.9999999999999999 tokens and a visitor who waited the whole refill
    // period is still refused.

    if (bucket === undefined) {
      if (buckets.size >= maxTrackedKeys) sweep(now);
      // An untracked key still gets its first burst budget, tracked now on.
      buckets.set(key, { tokens: budget.maxTokens - 1, lastRefill: now });
      return true;
    }

    const elapsed = Math.max(0, now - bucket.lastRefill);
    bucket.tokens = Math.min(
      budget.maxTokens,
      bucket.tokens + elapsed / budget.refillIntervalMs
    );
    bucket.lastRefill = now;

    if (bucket.tokens < 1) return false;
    bucket.tokens -= 1;
    return true;
  }

  function reset(): void {
    buckets.clear();
  }

  return { allow, reset };
}
