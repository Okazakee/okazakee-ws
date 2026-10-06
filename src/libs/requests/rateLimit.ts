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
import { createThrottle } from '@/libs/throttle';

export const requestThrottle = createThrottle(requestRateLimit);

/** Test seam: drops all tracked state between cases. */
export function resetRequestThrottle(): void {
  requestThrottle.reset();
}
