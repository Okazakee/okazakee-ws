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
