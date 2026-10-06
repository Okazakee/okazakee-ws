/**
 * Pure normalization for public post search.
 *
 * Everything here is unit-testable without Supabase or Next.js: the Server
 * Action validates first (no budget spent, no DB hit), then throttles, then
 * queries. Invalid input returns an empty result instead of touching the DB.
 */
import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
} from '@/config/search';

/**
 * Trims, collapses whitespace and strips PostgREST `.or()` metacharacters
 * (`,()`), `ilike` wildcards (`%_`) and quotes/backslashes, so the term can
 * be interpolated into one `or()` filter without breaking out of it.
 * Returns null when the cleaned term is outside the length gates.
 */
export function normalizeSearchTerm(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value
    // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional strip of control chars before PostgREST filter
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')
    .replace(/[,%_*"\\()']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
  if (
    cleaned.length < SEARCH_QUERY_MIN_LENGTH ||
    cleaned.length > SEARCH_QUERY_MAX_LENGTH
  ) {
    return null;
  }
  return cleaned;
}
