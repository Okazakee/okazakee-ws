/**
 * Server-only gate for public Markdown Storage reads (Phase 10A).
 *
 * Storage-first detail reads are OPT-IN and only valid in the dev clone:
 *   WS_BODY_STORAGE_READ_ENABLED = true
 *   APP_ENV != production
 *   NEXT_PUBLIC_SUPABASE_DB_SCHEMA = dev_staging
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
  if (env.appEnv === 'production') {
    return {
      mode: 'invalid',
      error: `${WS_BODY_STORAGE_READ_FLAG} must not be enabled in production (APP_ENV=production)`,
    };
  }
  if (env.schema !== 'dev_staging') {
    return {
      mode: 'invalid',
      error: `${WS_BODY_STORAGE_READ_FLAG} requires NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev_staging, got '${env.schema}'`,
    };
  }
  return { mode: 'enabled', bucket: CONTENT_BUCKET_DEV };
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
