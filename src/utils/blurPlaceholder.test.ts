import { describe, expect, it } from 'vitest';
import {
  isValidBlurPlaceholder,
  parseBodyImageAlt,
  resolveBlurDataURL,
} from './blurPlaceholder';

const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('isValidBlurPlaceholder', () => {
  it('accepts new-format data URLs', () => {
    expect(isValidBlurPlaceholder(DATA_URL)).toBe(true);
  });

  it('rejects legacy raw hashes', () => {
    expect(isValidBlurPlaceholder('L6PZfSi_.AyE_3t7t7R**0o#DgR4')).toBe(
      false
    );
  });

  it('rejects missing and malformed values', () => {
    expect(isValidBlurPlaceholder(null)).toBe(false);
    expect(isValidBlurPlaceholder(undefined)).toBe(false);
    expect(isValidBlurPlaceholder('')).toBe(false);
    expect(isValidBlurPlaceholder('not-a-data-url')).toBe(false);
    expect(isValidBlurPlaceholder('data:text/plain;base64,xxx')).toBe(
      false
    );
  });
});

describe('resolveBlurDataURL', () => {
  it('returns the data URL unchanged', () => {
    expect(resolveBlurDataURL(DATA_URL)).toBe(DATA_URL);
  });

  it('degrades legacy, missing and malformed to undefined', () => {
    expect(resolveBlurDataURL('L6PZfSi_.AyE_3t7t7R**0o#DgR4')).toBe(
      undefined
    );
    expect(resolveBlurDataURL(null)).toBe(undefined);
    expect(resolveBlurDataURL('')).toBe(undefined);
    expect(resolveBlurDataURL('data:image/png;base64,!!!')).toBe(
      undefined
    );
  });
});

describe('parseBodyImageAlt', () => {
  it('parses new-format placeholder after the first dash', () => {
    const parsed = parseBodyImageAlt(`My photo-${DATA_URL}`);
    expect(parsed.caption).toBe('My photo');
    expect(parsed.placeholder).toBe(DATA_URL);
  });

  it('never truncates a hash containing dashes', () => {
    const parsed = parseBodyImageAlt('Caption-L6PZ-abc-def');
    expect(parsed.caption).toBe('Caption');
    expect(parsed.placeholder).toBe('');
  });

  it('degrades legacy raw hashes to no placeholder', () => {
    const parsed = parseBodyImageAlt(
      'Caption-L6PZfSi_.AyE_3t7t7R**0o#DgR4'
    );
    expect(parsed.caption).toBe('Caption');
    expect(parsed.placeholder).toBe('');
  });

  it('handles missing and malformed placeholders', () => {
    expect(parseBodyImageAlt('Just a caption')).toEqual({
      caption: 'Just a caption',
      placeholder: '',
    });
    expect(parseBodyImageAlt('Cap-not-a-data-url').placeholder).toBe('');
  });

  it('stays compatible with CMS serialization', () => {
    const committed = `![My photo-${DATA_URL}](https://cdn.test/blog/1.webp)`;
    const alt = committed.slice(2, committed.indexOf(']('));
    const parsed = parseBodyImageAlt(alt);
    expect(parsed.caption).toBe('My photo');
    expect(parsed.placeholder).toBe(DATA_URL);
    expect(resolveBlurDataURL(parsed.placeholder)).toBe(DATA_URL);
  });
});

/**
 * Cross-repo placeholder contract (mirrors okazakee-cms `origin/main`
 * `src/utils/blurhashUtils.ts` + `src/utils/cms/postBody.ts`, same
 * representative literals, repo-specific expectations).
 *
 * Production contract, verified against both `origin` heads:
 * - CMS production writes ready-to-use data URLs (blurkit
 *   `encode(...).dataURL`, fallback `FALLBACK_BLUR_DATA_URL`);
 * - this site accepts data URLs and degrades anything else to no-blur,
 *   never passing it to next/image.
 * Raw BlurHash strings are legacy/pre-fix content only: the CMS parser
 * may retain the raw remainder as metadata, but no renderer treats it
 * as a placeholder — the caption/image still renders, the blur is
 * omitted. Do not "fix" the gate by accepting raw hashes.
 */
const LEGACY_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

describe('cross-repo placeholder contract', () => {
  it.each([
    {
      input: `My photo-${DATA_URL}`,
      caption: 'My photo',
      placeholder: DATA_URL,
      note: 'canonical data URL: blur on',
    },
    {
      input: `My photo-${LEGACY_HASH}`,
      caption: 'My photo',
      placeholder: '',
      note: 'legacy raw hash: sharp image, no blur',
    },
    {
      input: 'Caption-L6PZ-abc-def',
      caption: 'Caption',
      placeholder: '',
      note: 'dashes in the remainder never truncate the caption',
    },
    {
      input: 'Cap-not-a-data-url',
      caption: 'Cap',
      placeholder: '',
      note: 'malformed remainder degrades, caption kept',
    },
    {
      input: 'Cap-',
      caption: 'Cap',
      placeholder: '',
      note: 'empty remainder degrades, caption kept',
    },
    {
      input: 'Just a caption',
      caption: 'Just a caption',
      placeholder: '',
      note: 'no separator: whole alt is the caption',
    },
  ])('$note', ({ input, caption, placeholder }) => {
    expect(parseBodyImageAlt(input)).toEqual({ caption, placeholder });
  });

  it('rejects every non-data-URL the CMS may still store', () => {
    for (const value of [
      LEGACY_HASH,
      'L6PZ-abc-def',
      'not-a-data-url',
      'data:text/plain;base64,xxx',
      'data:image/png;base64,!!!',
      'data:image/gif;base64,iVBOR',
      null,
      undefined,
      '',
    ]) {
      expect(isValidBlurPlaceholder(value)).toBe(false);
      expect(
        resolveBlurDataURL(value as string | null | undefined)
      ).toBe(undefined);
    }
  });
});
