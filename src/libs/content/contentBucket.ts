/**
 * Content bucket resolution for the public site's Markdown reads (server-only).
 *
 * Post bodies live in ONE private bucket per environment and every detail read
 * downloads from it, so the bucket is resolved from the environment instead of
 * being named at the call site:
 *   APP_ENV=production + NEXT_PUBLIC_SUPABASE_DB_SCHEMA=public -> website-content
 *   APP_ENV!=production + NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev_staging -> website-content-dev
 *
 * Exactly those two pairings exist and they never cross: a production process
 * can never read the dev bucket and a dev clone can never read production
 * content. Anything else is a misconfiguration that fails closed BEFORE a query
 * or a download, because guessing a bucket would silently serve another
 * environment's Markdown.
 *
 * Pure decision logic is injectable for tests; the process environment is read
 * only by `currentContentBucket()`.
 */

/** Private dev content bucket that mirrors the CMS dual-write destination. */
export const CONTENT_BUCKET_DEV = 'website-content-dev';
/** Private production content bucket. */
export const CONTENT_BUCKET_PROD = 'website-content';

export type ContentBucketEnv = {
  appEnv: string;
  schema: string;
};

export type ContentBucketResolution =
  | { ok: true; bucket: string }
  | { ok: false; error: string };

/**
 * Environment -> content bucket, fail-closed. Throws on a mismatched or unknown
 * pairing rather than defaulting: the caller must surface a misconfiguration,
 * never read the wrong bucket.
 */
export function resolveContentBucket(env: ContentBucketEnv): string {
  if (env.appEnv === 'production' && env.schema === 'public') {
    return CONTENT_BUCKET_PROD;
  }
  if (env.appEnv !== 'production' && env.schema === 'dev_staging') {
    return CONTENT_BUCKET_DEV;
  }
  throw new Error(
    `[ws-content-bucket] refusing to resolve a content bucket for APP_ENV=${env.appEnv} schema=${env.schema} (expected production+public or non-production+dev_staging)`
  );
}

/** Result-typed variant, so a read path can fail closed with its own message. */
export function tryResolveContentBucket(
  env: ContentBucketEnv
): ContentBucketResolution {
  try {
    return { ok: true, bucket: resolveContentBucket(env) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Reads the environment lazily per call, so tests (and a process that changes
 * env) resolve at invocation time. Mirrors the env semantics of
 * `src/config/shared.ts`.
 */
export function currentContentBucket(): ContentBucketResolution {
  const appEnv =
    process.env.APP_ENV ??
    (process.env.NODE_ENV === 'production' ? 'production' : 'development');
  const schema = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA ?? 'public';
  return tryResolveContentBucket({ appEnv, schema });
}
