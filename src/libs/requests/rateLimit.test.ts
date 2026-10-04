import { beforeEach, describe, expect, it } from 'vitest';
import { requestRateLimit } from '@/config/requests';
import { allowRequest, resetRequestThrottle } from './rateLimit';

const start = 1_700_000_000_000;

beforeEach(() => {
  resetRequestThrottle();
});

describe('allowRequest', () => {
  it('spends the burst budget, then refuses until the bucket refills', () => {
    for (let index = 0; index < requestRateLimit.maxTokens; index += 1) {
      expect(allowRequest('198.51.100.1', start)).toBe(true);
    }
    expect(allowRequest('198.51.100.1', start)).toBe(false);

    const halfway = start + requestRateLimit.refillIntervalMs / 2;
    expect(allowRequest('198.51.100.1', halfway)).toBe(false);

    expect(
      allowRequest('198.51.100.1', start + requestRateLimit.refillIntervalMs)
    ).toBe(true);
  });

  it('never refills past the burst ceiling', () => {
    const longAfter = start + requestRateLimit.refillIntervalMs * 100;
    let granted = 0;
    for (let index = 0; index < requestRateLimit.maxTokens + 5; index += 1) {
      if (allowRequest('198.51.100.2', longAfter)) granted += 1;
    }
    expect(granted).toBe(requestRateLimit.maxTokens);
  });

  it('tracks each IP separately', () => {
    for (let index = 0; index < requestRateLimit.maxTokens; index += 1) {
      allowRequest('198.51.100.3', start);
    }
    expect(allowRequest('198.51.100.3', start)).toBe(false);
    expect(allowRequest('198.51.100.4', start)).toBe(true);
  });

  it('ignores a clock that jumps backwards', () => {
    for (let index = 0; index < requestRateLimit.maxTokens; index += 1) {
      allowRequest('198.51.100.5', start);
    }
    expect(allowRequest('198.51.100.5', start - 60_000)).toBe(false);
  });
});
