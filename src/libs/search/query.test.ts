import { describe, expect, it } from 'vitest';
import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
} from '@/config/search';
import { normalizeSearchTerm } from './query';

describe('normalizeSearchTerm', () => {
  it('lowercases and trims the term', () => {
    expect(normalizeSearchTerm('  Ada Lovelace  ')).toBe('ada lovelace');
  });

  it('collapses inner whitespace', () => {
    expect(normalizeSearchTerm('engine   metrics')).toBe('engine metrics');
  });

  it('strips PostgREST or/ilike metacharacters', () => {
    expect(normalizeSearchTerm('a,b(c)%_*"\\\'')).toBe('abc');
  });

  it('rejects terms outside the length gates', () => {
    expect(normalizeSearchTerm('ab')).toBeNull();
    expect(normalizeSearchTerm('x'.repeat(SEARCH_QUERY_MAX_LENGTH + 1))).toBe(
      null
    );
    expect(
      normalizeSearchTerm('x'.repeat(SEARCH_QUERY_MIN_LENGTH))
    ).not.toBeNull();
  });

  it('rejects non-string input', () => {
    expect(normalizeSearchTerm(42)).toBeNull();
    expect(normalizeSearchTerm(null)).toBeNull();
  });
});
