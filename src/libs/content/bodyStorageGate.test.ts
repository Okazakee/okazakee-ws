import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONTENT_BUCKET_DEV,
  CONTENT_BUCKET_PROD,
  currentWsBodyStorageRead,
  resolveWsBodyStorageRead,
  WS_BODY_STORAGE_READ_FLAG,
  wsBodyPointersReadable,
} from '@/libs/content/bodyStorageGate';

describe('resolveWsBodyStorageRead', () => {
  it('is disabled by default, whatever the environment', () => {
    expect(
      resolveWsBodyStorageRead({
        enabled: false,
        appEnv: 'development',
        schema: 'dev_staging',
      })
    ).toEqual({ mode: 'disabled' });
    expect(
      resolveWsBodyStorageRead({
        enabled: false,
        appEnv: 'production',
        schema: 'public',
      })
    ).toEqual({ mode: 'disabled' });
  });

  it('enables the dev clone against the private dev content bucket', () => {
    expect(
      resolveWsBodyStorageRead({
        enabled: true,
        appEnv: 'development',
        schema: 'dev_staging',
      })
    ).toEqual({ mode: 'enabled', bucket: CONTENT_BUCKET_DEV });
  });

  it('enables the production bucket only for production+public', () => {
    expect(
      resolveWsBodyStorageRead({
        enabled: true,
        appEnv: 'production',
        schema: 'public',
      })
    ).toEqual({ mode: 'enabled', bucket: CONTENT_BUCKET_PROD });
  });

  it('rejects a production env pointed at the dev clone schema', () => {
    const decision = resolveWsBodyStorageRead({
      enabled: true,
      appEnv: 'production',
      schema: 'dev_staging',
    });
    expect(decision.mode).toBe('invalid');
    expect(decision.mode === 'invalid' ? decision.error : '').toContain(
      'requires APP_ENV=production'
    );
  });

  it('never crosses buckets between environments', () => {
    const prod = resolveWsBodyStorageRead({
      enabled: true,
      appEnv: 'production',
      schema: 'public',
    });
    const dev = resolveWsBodyStorageRead({
      enabled: true,
      appEnv: 'development',
      schema: 'dev_staging',
    });
    expect(prod).toEqual({ mode: 'enabled', bucket: 'website-content' });
    expect(dev).toEqual({ mode: 'enabled', bucket: 'website-content-dev' });
    expect(
      resolveWsBodyStorageRead({ enabled: true, appEnv: 'production', schema: 'dev_staging' }).mode
    ).toBe('invalid');
    expect(
      resolveWsBodyStorageRead({ enabled: true, appEnv: 'development', schema: 'public' }).mode
    ).toBe('invalid');
  });

  it('rejects enablement outside the dev clone schema', () => {
    const decision = resolveWsBodyStorageRead({
      enabled: true,
      appEnv: 'development',
      schema: 'public',
    });
    expect(decision.mode).toBe('invalid');
    expect(decision.mode === 'invalid' ? decision.error : '').toContain(
      'NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev_staging'
    );
  });

  it('lets only the enabled dev clone name the pointer columns', () => {
    expect(
      wsBodyPointersReadable({ mode: 'enabled', bucket: CONTENT_BUCKET_DEV })
    ).toBe(true);
    expect(wsBodyPointersReadable({ mode: 'disabled' })).toBe(false);
    expect(wsBodyPointersReadable({ mode: 'invalid', error: 'nope' })).toBe(
      false
    );
  });
});

describe('currentWsBodyStorageRead', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete process.env.APP_ENV;
  });

  it('stays disabled when the flag is absent in a valid dev clone', () => {
    vi.stubEnv('APP_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'dev_staging');
    expect(currentWsBodyStorageRead()).toEqual({ mode: 'disabled' });
  });

  it('enables only when the flag is exactly "true"', () => {
    vi.stubEnv('APP_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'dev_staging');
    vi.stubEnv(WS_BODY_STORAGE_READ_FLAG, 'TRUE');
    expect(currentWsBodyStorageRead().mode).toBe('disabled');
    vi.stubEnv(WS_BODY_STORAGE_READ_FLAG, 'true');
    expect(currentWsBodyStorageRead().mode).toBe('enabled');
  });

  it('rejects enablement against a non-dev schema', () => {
    vi.stubEnv('APP_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'public');
    vi.stubEnv(WS_BODY_STORAGE_READ_FLAG, 'true');
    expect(currentWsBodyStorageRead().mode).toBe('invalid');
  });

  it('derives production semantics from NODE_ENV when APP_ENV is unset', () => {
    delete process.env.APP_ENV;
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'public');
    vi.stubEnv(WS_BODY_STORAGE_READ_FLAG, 'true');
    // NODE_ENV=production resolves production semantics, so the public schema
    // enables reads against the PRODUCTION bucket — never the dev one.
    expect(currentWsBodyStorageRead()).toEqual({
      mode: 'enabled',
      bucket: 'website-content',
    });
  });
});
