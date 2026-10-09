import { describe, expect, it } from 'vitest';
import {
  readIntakeErrorCode,
  REQUEST_FIELD_LIMITS,
  validateRequestIntake,
} from './intake';

const valid = {
  locale: 'en',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  company: 'Analytical Engines',
  website: 'https://example.com',
  type: 'Web app',
  budget: '€5–15k',
  timeline: 'ASAP',
  request: 'A dashboard for engine metrics.',
  consent: true,
};

function rejection(body: unknown) {
  const result = validateRequestIntake(body);
  if (result.ok) throw new Error('expected the payload to be rejected');
  return result;
}

describe('validateRequestIntake', () => {
  it('accepts a complete payload and trims the free-text fields', () => {
    const result = validateRequestIntake({
      ...valid,
      name: '  Ada  ',
      website: '  https://example.com/path  ',
    });
    expect(result).toEqual({
      ok: true,
      payload: {
        ...valid,
        name: 'Ada',
        website: 'https://example.com/path',
      },
    });
  });

  it('treats an absent website as empty rather than invalid', () => {
    const result = validateRequestIntake({ ...valid, website: '   ' });
    expect(result.ok && result.payload.website).toBe('');
  });

  it('treats an absent company as empty: individuals need no company', () => {
    const result = validateRequestIntake({ ...valid, company: '' });
    expect(result.ok && result.payload.company).toBe('');
  });

  it('rejects a website that is not an absolute http(s) URL', () => {
    for (const website of [
      'example.com',
      '/relative/path',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://example.com',
      'not a url at all',
    ]) {
      expect(rejection({ ...valid, website })).toEqual({
        ok: false,
        field: 'website',
        code: 'invalidField',
      });
    }
  });

  it('requires the privacy consent and reports it as its own failure', () => {
    for (const consent of [false, undefined, 'true', 1, null]) {
      expect(rejection({ ...valid, consent })).toEqual({
        ok: false,
        field: 'consent',
        code: 'missingConsent',
      });
    }
  });

  it('caps every field length before anything reaches storage', () => {
    expect(rejection({ ...valid, name: 'a'.repeat(200) }).field).toBe('name');
    expect(
      rejection({
        ...valid,
        email: `${'a'.repeat(250)}@example.com`,
      }).field
    ).toBe('email');
    expect(
      rejection({
        ...valid,
        company: 'a'.repeat(REQUEST_FIELD_LIMITS.company + 1),
      }).field
    ).toBe('company');
    expect(
      rejection({
        ...valid,
        request: 'a'.repeat(REQUEST_FIELD_LIMITS.request + 1),
      }).field
    ).toBe('request');
  });

  it('rejects an email that is not an address', () => {
    for (const email of ['ada', 'ada@', '@example.com', 'ada example.com']) {
      expect(rejection({ ...valid, email }).field).toBe('email');
    }
  });

  it('rejects option values outside the storage vocabulary', () => {
    expect(rejection({ ...valid, type: 'Spaceship' }).field).toBe('type');
    expect(rejection({ ...valid, budget: '€100k' }).field).toBe('budget');
    expect(rejection({ ...valid, timeline: 'Yesterday' }).field).toBe(
      'timeline'
    );
  });

  it('rejects an unsupported locale instead of silently defaulting it', () => {
    expect(rejection({ ...valid, locale: 'fr' }).field).toBe('locale');
  });

  it('rejects a body that is not a JSON object', () => {
    for (const body of [null, 'nope', 42, ['a']]) {
      expect(rejection(body).code).toBe('invalidBody');
    }
  });
});

describe('readIntakeErrorCode', () => {
  it('reads a known code from an endpoint error body', () => {
    expect(readIntakeErrorCode({ code: 'missingConsent' })).toBe(
      'missingConsent'
    );
    expect(readIntakeErrorCode({ code: 'tooManyRequests' })).toBe(
      'tooManyRequests'
    );
  });

  it('returns null for anything it does not recognize', () => {
    expect(readIntakeErrorCode({ code: 'drop table' })).toBeNull();
    expect(readIntakeErrorCode({ code: 42 })).toBeNull();
    expect(readIntakeErrorCode({})).toBeNull();
    expect(readIntakeErrorCode(null)).toBeNull();
  });
});
