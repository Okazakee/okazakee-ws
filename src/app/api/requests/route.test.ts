import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreRequestResult } from '@/libs/requests/store';

const h = vi.hoisted(() => ({
  storeRequest: vi.fn(
    async (): Promise<StoreRequestResult> => ({ ok: true, id: '42' })
  ),
  intakeEnabled: { current: true },
}));

vi.mock('@/libs/requests/store', () => ({ storeRequest: h.storeRequest }));
vi.mock('@/config/public', () => ({
  publicConfig: {
    get requestIntakeEnabled() {
      return h.intakeEnabled.current;
    },
  },
}));

import { POST } from './route';
import { resetRequestThrottle } from '@/libs/requests/rateLimit';

const body = {
  locale: 'it',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: '',
  website: 'https://example.com',
  type: 'Web app',
  budget: '€5–15k',
  timeline: 'ASAP',
  request: 'A dashboard for engine metrics.',
  consent: true,
};

function post(payload: unknown, ip = '203.0.113.7'): Promise<Response> {
  return POST(
    new Request('http://localhost:3000/api/requests', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
      body: typeof payload === 'string' ? payload : JSON.stringify(payload),
    })
  );
}

beforeEach(() => {
  resetRequestThrottle();
  h.intakeEnabled.current = true;
  h.storeRequest.mockClear();
  h.storeRequest.mockResolvedValue({ ok: true, id: '42' });
});

afterEach(() => {
  resetRequestThrottle();
});

describe('POST /api/requests', () => {
  it('stores a valid request and answers with its id', async () => {
    const response = await post(body);
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true, id: '42' });
    expect(h.storeRequest).toHaveBeenCalledWith({
      ...body,
      company: '',
      consent: true,
    });
  });

  it('rejects a non-http website before touching storage', async () => {
    const response = await post({ ...body, website: 'javascript:alert(1)' });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: 'invalidField',
      field: 'website',
    });
    expect(h.storeRequest).not.toHaveBeenCalled();
  });

  it('rejects a missing privacy consent with its own code', async () => {
    const response = await post({ ...body, consent: false });
    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      code: 'missingConsent',
      field: 'consent',
    });
    expect(h.storeRequest).not.toHaveBeenCalled();
  });

  it('rejects a malformed body without storing anything', async () => {
    const response = await post('{not json');
    expect(response.status).toBe(400);
    expect(h.storeRequest).not.toHaveBeenCalled();
  });

  it('rejects an oversized body on the declared length alone', async () => {
    const response = await POST(
      new Request('http://localhost:3000/api/requests', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'content-length': String(64 * 1024),
        },
        body: JSON.stringify(body),
      })
    );
    expect(response.status).toBe(413);
    await expect(response.json()).resolves.toEqual({
      code: 'bodyTooLarge',
      field: 'request',
    });
    expect(h.storeRequest).not.toHaveBeenCalled();
  });

  it('throttles a single IP after its burst budget is spent', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect((await post(body)).status).toBe(201);
    }
    const throttled = await post(body);
    expect(throttled.status).toBe(429);
    await expect(throttled.json()).resolves.toEqual({
      code: 'tooManyRequests',
      field: 'locale',
    });
    expect(h.storeRequest).toHaveBeenCalledTimes(3);
  });

  it('keeps one abusive IP from spending another IP budget', async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await post(body, '198.51.100.9');
    }
    expect((await post(body, '198.51.100.9')).status).toBe(429);
    expect((await post(body, '198.51.100.10')).status).toBe(201);
  });

  it('answers 503 without storing when intake is switched off', async () => {
    h.intakeEnabled.current = false;
    const response = await post(body);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: 'intakeDisabled',
      field: 'locale',
    });
    expect(h.storeRequest).not.toHaveBeenCalled();
  });

  it('reports a storage failure instead of confirming a lost message', async () => {
    h.storeRequest.mockResolvedValue({ ok: false, error: 'relation missing' });
    const response = await post(body);
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      code: 'storageUnavailable',
      field: 'request',
    });
  });
});
