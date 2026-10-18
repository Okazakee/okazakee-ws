/**
 * Server-only gate for public Markdown Storage reads (Phase 10A).
 *
 * Storage-first detail reads are OPT-IN. Exactly two environments may enable
 * them, and they resolve different buckets:
 *   WS_BODY_STORAGE_READ_ENABLED = true
 *   APP_ENV=production + NEXT_PUBLIC_SUPABASE_DB_SCHEMA=public -> website-content
 *   APP_ENV!=production + NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev_staging -> website-content-dev
 *
 * When disabled the public site keeps the PostgreSQL-only read: the existing
 * detail projections are used and the pointer columns are never named in a
 * query, so production can never depend on a content bucket.
 *
 * An explicitly enabled but incompatible environment is rejected before any DB
 * or Storage call. The flag is never enabled remotely by this code.
 *
 * Pure decision logic is injectable for tests; the process environment is read
 * only by `currentWsBodyStorageRead()`.
 */

export const WS_BODY_STORAGE_READ_FLAG = 'WS_BODY_STORAGE_READ_ENABLED';

/** Private dev content bucket that mirrors the CMS dual-write destination. */
export const CONTENT_BUCKET_DEV = 'website-content-dev';
/** Private production content bucket (created only by the production cutover). */
export const CONTENT_BUCKET_PROD = 'website-content';

export type WsBodyStorageReadEnv = {
  /** Raw flag value — enabled only when exactly `'true'`. */
  enabled: boolean;
  appEnv: string;
  schema: string;
};

export type WsBodyStorageReadDecision =
  /** PostgreSQL-only reads with the existing detail projections. */
  | { mode: 'disabled' }
  /** Storage-first reads against the private dev content bucket. */
  | { mode: 'enabled'; bucket: string }
  /** Explicitly enabled in an incompatible environment: refuse before reading. */
  | { mode: 'invalid'; error: string };

export function resolveWsBodyStorageRead(
  env: WsBodyStorageReadEnv
): WsBodyStorageReadDecision {
  if (!env.enabled) {
    return { mode: 'disabled' };
  }
  // Exactly two pairings are valid and they never cross: production+public
  // reads the production bucket, a non-production clone+dev_staging reads the
  // dev bucket. Anything else fails closed before a query.
  const isProduction = env.appEnv === 'production' && env.schema === 'public';
  const isDevClone = env.appEnv !== 'production' && env.schema === 'dev_staging';
  if (!isProduction && !isDevClone) {
    return {
      mode: 'invalid',
      error: `${WS_BODY_STORAGE_READ_FLAG} requires APP_ENV=production with NEXT_PUBLIC_SUPABASE_DB_SCHEMA=public (${CONTENT_BUCKET_PROD}) or a non-production APP_ENV with NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev_staging (${CONTENT_BUCKET_DEV}); got APP_ENV=${env.appEnv} schema=${env.schema}`,
    };
  }
  return {
    mode: 'enabled',
    bucket: isProduction ? CONTENT_BUCKET_PROD : CONTENT_BUCKET_DEV,
  };
}

export function currentWsBodyStorageRead(): WsBodyStorageReadDecision {
  // Read lazily per call so tests (and a process that changes env) resolve the
  // gate at invocation time. Mirrors src/config/shared.ts env semantics.
  const appEnv =
    process.env.APP_ENV ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'development');
  const schema = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA ?? 'public';
  return resolveWsBodyStorageRead({
    enabled: process.env[WS_BODY_STORAGE_READ_FLAG] === 'true',
    appEnv,
    schema,
  });
}

/**
 * Whether a detail query may name the pointer columns. Only the enabled dev
 * clone: production has no pointer columns and must never query them.
 */
export function wsBodyPointersReadable(
  decision: WsBodyStorageReadDecision
): boolean {
  return decision.mode === 'enabled';
}
