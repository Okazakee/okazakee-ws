/**
 * Per-IP search throttle for the public post-search action.
 *
 * In-process by design: search is anonymous and needs no new infrastructure,
 * and a bound that is per-instance still caps what a single visitor can push
 * through one instance. It is an abuse-and-cost bound, not an authorization
 * control — the query only ever reads public, non-hidden posts.
 */
import { searchRateLimit } from '@/config/search';
import { createThrottle } from '@/libs/throttle';

export const searchThrottle = createThrottle(searchRateLimit);
