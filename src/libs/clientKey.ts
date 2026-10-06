/**
 * Client key for anonymous per-IP budgets.
 *
 * Reads the platform-reported IP: `x-forwarded-for` is a comma-separated
 * chain whose first entry is the original client. It is only a throttle key,
 * never an authorization input.
 */
export function clientKeyFromHeaders(
  headers: Pick<Headers, 'get'>
): string {
  const forwarded = headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  if (first) return first;
  return headers.get('x-real-ip') ?? 'unknown';
}
