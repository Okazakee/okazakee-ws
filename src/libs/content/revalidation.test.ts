import { describe, expect, it } from 'vitest';
import {
  isTimestampFresh,
  signRevalidationEvent,
  validateRevalidationEvent,
  verifyRevalidationSignature,
} from '@/libs/content/revalidation';

const SECRET = 'test-secret-123';

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    eventId: 'a1b2c3d4-1234',
    occurredAt: '2026-08-17T09:00:00.000Z',
    source: 'okazakee-cms',
    operation: 'update',
    entity: 'blog',
    entityId: 42,
    tags: ['blog', 'posts', 'post:blog:42'],
    ...overrides,
  };
}

describe('validateRevalidationEvent', () => {
  it('accepts a valid event', () => {
    const result = validateRevalidationEvent(makeEvent());
    expect(result.ok).toBe(true);
  });

  it('rejects unsupported versions', () => {
    const result = validateRevalidationEvent(makeEvent({ version: 2 }));
    expect(result.ok).toBe(false);
  });

  it('rejects bad event ids and timestamps', () => {
    expect(validateRevalidationEvent(makeEvent({ eventId: 'x' })).ok).toBe(false);
    expect(
      validateRevalidationEvent(makeEvent({ occurredAt: 'not-a-date' })).ok
    ).toBe(false);
  });

  it('rejects unknown source/operation/entity', () => {
    expect(
      validateRevalidationEvent(makeEvent({ source: 'evil' })).ok
    ).toBe(false);
    expect(
      validateRevalidationEvent(makeEvent({ operation: 'drop-table' })).ok
    ).toBe(false);
    expect(
      validateRevalidationEvent(makeEvent({ entity: 'users' })).ok
    ).toBe(false);
  });

  it('rejects entityId of wrong type', () => {
    expect(
      validateRevalidationEvent(makeEvent({ entityId: { nested: true } })).ok
    ).toBe(false);
  });

  it('rejects missing/empty/oversized tag lists', () => {
    expect(validateRevalidationEvent(makeEvent({ tags: [] })).ok).toBe(false);
    expect(
      validateRevalidationEvent(
        makeEvent({ tags: Array.from({ length: 51 }, (_, i) => `post:blog:${i}`) })
      ).ok
    ).toBe(false);
  });

  it('rejects tags outside the allowed namespace', () => {
    expect(
      validateRevalidationEvent(makeEvent({ tags: ['posts', '../../etc'] })).ok
    ).toBe(false);
    expect(
      validateRevalidationEvent(makeEvent({ tags: ['post:blog:1', 'user:5'] }))
        .ok
    ).toBe(false);
    expect(
      validateRevalidationEvent(
        makeEvent({ tags: ['posts', 'post:blog:1', 'author:user-1'] })
      ).ok
    ).toBe(true);
  });

  it('deduplicates tags', () => {
    const result = validateRevalidationEvent(
      makeEvent({ tags: ['posts', 'posts', 'blog'] })
    );
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.event.tags).toEqual(['posts', 'blog']);
  });
});

describe('sign/verify', () => {
  const body = JSON.stringify(makeEvent());
  const timestamp = '2026-08-17T09:00:00.000Z';

  it('verifies a valid signature', () => {
    const sig = signRevalidationEvent(SECRET, timestamp, body);
    expect(verifyRevalidationSignature(SECRET, timestamp, body, sig)).toBe(
      true
    );
  });

  it('rejects wrong secret', () => {
    const sig = signRevalidationEvent(SECRET, timestamp, body);
    expect(
      verifyRevalidationSignature('other-secret', timestamp, body, sig)
    ).toBe(false);
  });

  it('rejects modified body', () => {
    const sig = signRevalidationEvent(SECRET, timestamp, body);
    expect(
      verifyRevalidationSignature(SECRET, timestamp, `${body}x`, sig)
    ).toBe(false);
  });

  it('rejects different timestamp', () => {
    const sig = signRevalidationEvent(SECRET, timestamp, body);
    expect(
      verifyRevalidationSignature(
        SECRET,
        '2026-08-17T09:01:00.000Z',
        body,
        sig
      )
    ).toBe(false);
  });

  it('rejects malformed signatures', () => {
    expect(verifyRevalidationSignature(SECRET, timestamp, body, 'nope')).toBe(
      false
    );
    expect(
      verifyRevalidationSignature(SECRET, timestamp, body, 'v1=abc')
    ).toBe(false);
  });
});

describe('isTimestampFresh', () => {
  const now = Date.parse('2026-08-17T09:00:00.000Z');

  it('accepts now and small skew', () => {
    expect(isTimestampFresh('2026-08-17T09:00:00.000Z', now)).toBe(true);
    expect(isTimestampFresh('2026-08-17T09:04:59.000Z', now)).toBe(true);
  });

  it('rejects old and future timestamps beyond the window', () => {
    expect(isTimestampFresh('2026-08-17T08:50:00.000Z', now)).toBe(false);
    expect(isTimestampFresh('2026-08-17T09:10:00.000Z', now)).toBe(false);
  });

  it('rejects garbage', () => {
    expect(isTimestampFresh('garbage', now)).toBe(false);
  });
});
