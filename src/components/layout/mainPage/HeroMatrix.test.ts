import { describe, expect, it } from 'vitest';
import { resolveNumericToken } from '@/components/layout/mainPage/HeroMatrix';

/**
 * The pointer warp's reach and strength are CSS tokens, so a missing or
 * malformed value must not disable the effect: anything unusable falls back to
 * the constant the caller passes in.
 */
describe('resolveNumericToken', () => {
  it('reads the token, trimming and ignoring a stray unit', () => {
    expect(resolveNumericToken('18', 12)).toBe(18);
    expect(resolveNumericToken(' 24 ', 12)).toBe(24);
    expect(resolveNumericToken('18px', 12)).toBe(18);
    expect(resolveNumericToken('13.5', 12)).toBe(13.5);
    expect(resolveNumericToken('9', 6)).toBe(9);
  });

  it('falls back when the token is absent or unusable', () => {
    for (const raw of [
      '',
      '   ',
      null,
      undefined,
      'var(--nope)',
      '0',
      '-3',
      'Infinity',
    ]) {
      expect(resolveNumericToken(raw, 12)).toBe(12);
      expect(resolveNumericToken(raw, 6)).toBe(6);
    }
  });
});
