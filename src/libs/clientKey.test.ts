import { describe, expect, it } from 'vitest';
import { clientKeyFromHeaders } from './clientKey';

function headers(entries: Record<string, string>): Headers {
  return new Headers(entries);
}

describe('clientKeyFromHeaders', () => {
  it('takes the first x-forwarded-for entry', () => {
    expect(
      clientKeyFromHeaders(
        headers({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18' })
      )
    ).toBe('203.0.113.7');
  });

  it('falls back to x-real-ip, then unknown', () => {
    expect(clientKeyFromHeaders(headers({ 'x-real-ip': '198.51.100.9' }))).toBe(
      '198.51.100.9'
    );
    expect(clientKeyFromHeaders(headers({}))).toBe('unknown');
  });
});
