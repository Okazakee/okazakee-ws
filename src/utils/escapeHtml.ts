/**
 * Escapes CMS/user-controlled plain text before it is interpolated into
 * HTML strings consumed by `InnerHtml`.
 *
 * Contract: the application's own generated markup (`<label>`, cursor
 * `<span>`) stays literal HTML; every external character placed inside
 * that markup passes through here first. The `****` marker syntax uses
 * `*`, which escaping leaves untouched, so builders escape the input
 * before parsing markers — never the final HTML after inserting markup.
 */

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}
