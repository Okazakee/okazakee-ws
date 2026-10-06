import { beforeEach, describe, expect, it } from 'vitest';
import { searchRateLimit } from '@/config/search';
import { searchThrottle } from './rateLimit';

const start = 1_700_000_000_000;

beforeEach(() => {
  searchThrottle.reset();
});

describe('searchThrottle', () => {
  it('spends the burst budget, then refuses until the bucket refills', () => {
    for (let index = 0; index < searchRateLimit.maxTokens; index += 1) {
      expect(searchThrottle.allow('198.51.100.1', start)).toBe(true);
    }
    expect(searchThrottle.allow('198.51.100.1', start)).toBe(false);

    const halfway = start + searchRateLimit.refillIntervalMs / 2;
    expect(searchThrottle.allow('198.51.100.1', halfway)).toBe(false);

    expect(
      searchThrottle.allow('198.51.100.1', start + searchRateLimit.refillIntervalMs)
    ).toBe(true);
  });

  it('never refills past the burst ceiling', () => {
    const longAfter = start + searchRateLimit.refillIntervalMs * 100;
    let granted = 0;
    for (let index = 0; index < searchRateLimit.maxTokens + 5; index += 1) {
      if (searchThrottle.allow('198.51.100.2', longAfter)) granted += 1;
    }
    expect(granted).toBe(searchRateLimit.maxTokens);
  });

  it('tracks each IP separately', () => {
    for (let index = 0; index < searchRateLimit.maxTokens; index += 1) {
      searchThrottle.allow('198.51.100.3', start);
    }
    expect(searchThrottle.allow('198.51.100.3', start)).toBe(false);
    expect(searchThrottle.allow('198.51.100.4', start)).toBe(true);
  });

  it('ignores a clock that jumps backwards', () => {
    for (let index = 0; index < searchRateLimit.maxTokens; index += 1) {
      searchThrottle.allow('198.51.100.5', start);
    }
    expect(searchThrottle.allow('198.51.100.5', start - 60_000)).toBe(false);
  });
});
