import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CONTENT_BUCKET_DEV,
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

  it('rejects enablement in production before any read', () => {
    const decision = resolveWsBodyStorageRead({
      enabled: true,
      appEnv: 'production',
      schema: 'dev_staging',
    });
    expect(decision.mode).toBe('invalid');
    expect(decision.mode === 'invalid' ? decision.error : '').toContain(
      'must not be enabled in production'
    );
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
    vi.stubEnv(WS_BODY_STORAGE_READ_FLAG, 'true');
    expect(currentWsBodyStorageRead().mode).toBe('invalid');
  });
});
