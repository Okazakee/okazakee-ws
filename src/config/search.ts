/**
 * Server-only configuration for public post search.
 *
 * Search is an anonymous read: the budget below is enforced per client IP
 * inside the search Server Action (see src/app/actions/search.ts). It is
 * a cost-and-abuse bound, not an authorization control — the query itself
 * only ever reads public, non-hidden posts through the publishable key.

/** Raw query gates, mirrored by the search input behaviour. */
export const SEARCH_QUERY_MIN_LENGTH = 3;
export const SEARCH_QUERY_MAX_LENGTH = 40;

/** Upper bound on rows per search, so one query cannot page the table. */
export const MAX_SEARCH_RESULTS = 50;

/**
 * Per-IP search budget. Ten requests bursting, refilling one per second:
 * generous enough for debounced as-you-type queries, tight enough that a
 * single client cannot hammer the read path.
 */
export const searchRateLimit = {
  maxTokens: 10,
  refillIntervalMs: 1000,
} as const;
