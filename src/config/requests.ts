/**
 * Server-only configuration for the public project-request intake.
 *
 * Nothing here is `NEXT_PUBLIC_`: the secret key must never reach the browser
 * bundle. Kept apart from `src/config/public.ts` (which client components
 * import) so the elevated credential cannot be pulled into a client graph.
 *
 * Intake writes through the service-role client because `project_requests`
 * holds personal data and has NO anon/authenticated grant — the CMS owns
 * every other write in this project, but this one endpoint must accept
 * writes from anonymous visitors, so the public site is the only place the
 * service-role key is legitimately used.
 */

/** Secret API key (sb_secret_…); falls back to the legacy service-role name. */
export const supabaseServerSecret =
  process.env.SUPABASE_SECRET_KEY ??
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  '';

/**
 * Hard cap on the raw request body. The payload is a short form: 8 KB leaves
 * an order of magnitude of headroom over the field limits while making a
 * flood of large bodies impossible before any parsing happens.
 */
export const MAX_REQUEST_BODY_BYTES = 8 * 1024;

/**
 * Per-IP submission budget. Three requests, refilling one every 30 minutes.
 *
 * In-process and therefore per-instance: it is a cost-and-abuse bound, not a
 * security control (the endpoint is public by design). A visitor behind a
 * shared NAT gets a slower refill, not a lockout, because the bucket refills
 * continuously rather than resetting on a fixed window.
 */
export const requestRateLimit = {
  maxTokens: 3,
  refillIntervalMs: 30 * 60 * 1000,
} as const;
