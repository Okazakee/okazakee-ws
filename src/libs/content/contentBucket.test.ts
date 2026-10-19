import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONTENT_BUCKET_DEV,
  CONTENT_BUCKET_PROD,
  currentContentBucket,
  resolveContentBucket,
  tryResolveContentBucket,
} from '@/libs/content/contentBucket';

/**
 * Content bucket resolution for public detail reads. The pure mapping is
 * exercised directly and the environment wrapper through `vi.stubEnv`, so the
 * bucket a deployed process reads is proven both ways.
 */
describe('resolveContentBucket', () => {
  it('maps the two consistent environment pairs', () => {
    expect(
      resolveContentBucket({ appEnv: 'production', schema: 'public' })
    ).toBe(CONTENT_BUCKET_PROD);
    expect(
      resolveContentBucket({ appEnv: 'development', schema: 'dev_staging' })
    ).toBe(CONTENT_BUCKET_DEV);
    expect(
      resolveContentBucket({ appEnv: 'staging', schema: 'dev_staging' })
    ).toBe(CONTENT_BUCKET_DEV);
  });

  it('never crosses buckets between environments', () => {
    expect(() =>
      resolveContentBucket({ appEnv: 'production', schema: 'dev_staging' })
    ).toThrow('refusing to resolve a content bucket');
    expect(() =>
      resolveContentBucket({ appEnv: 'development', schema: 'public' })
    ).toThrow('refusing to resolve a content bucket');
  });

  it('fails closed on an unknown pairing instead of guessing a bucket', () => {
    for (const env of [
      { appEnv: 'development', schema: '' },
      { appEnv: '', schema: 'public' },
      { appEnv: 'production', schema: 'other' },
    ]) {
      const resolution = tryResolveContentBucket(env);
      expect(resolution.ok).toBe(false);
      expect(resolution.ok ? '' : resolution.error).toContain(
        'refusing to resolve a content bucket'
      );
    }
  });
});

describe('currentContentBucket', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.APP_ENV;
  });

  it('resolves the dev bucket for the dev clone', () => {
    vi.stubEnv('APP_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'dev_staging');
    expect(currentContentBucket()).toEqual({
      ok: true,
      bucket: CONTENT_BUCKET_DEV,
    });
  });

  it('derives production semantics from NODE_ENV when APP_ENV is unset', () => {
    delete process.env.APP_ENV;
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'public');
    // NODE_ENV=production resolves production semantics, so a public schema
    // reads the PRODUCTION bucket — never the dev one.
    expect(currentContentBucket()).toEqual({
      ok: true,
      bucket: CONTENT_BUCKET_PROD,
    });
  });

  it('fails closed when the schema is missing outside production', () => {
    vi.stubEnv('APP_ENV', 'development');
    delete process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA;
    // The default schema is `public`, which a non-production process must not
    // read content from.
    expect(currentContentBucket().ok).toBe(false);
  });
});
