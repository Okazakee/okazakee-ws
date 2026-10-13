import { describe, expect, it } from 'vitest';
import { formatLabels } from './formatLabels';

// Cross-repo marker contract: mirrors okazakee-cms
// `src/utils/cms/markers.ts` (same `****([^*]+)****` semantics).
// Intentional difference: runs render as `<label>` here vs
// `<span data-marker="1">` in the CMS editor; this site also escapes `'`.

const PAYLOAD =
  '<img src=x onerror="document.documentElement.dataset.xss=\'1\'">';

describe('formatLabels', () => {
  it('leaves normal text unchanged', () => {
    expect(formatLabels('Fullstack Developer')).toBe('Fullstack Developer');
  });

  it('wraps **** regions in label markup', () => {
    expect(formatLabels('a ****b**** c')).toBe('a <label>b</label> c');
  });

  it('handles multiple formatted regions', () => {
    expect(formatLabels('a ****b**** c ****d**** e')).toBe(
      'a <label>b</label> c <label>d</label> e'
    );
  });

  it('renders metacharacters as inert text', () => {
    expect(formatLabels('R&D <3 "quoted" \'single\'')).toBe(
      'R&amp;D &lt;3 &quot;quoted&quot; &#x27;single&#x27;'
    );
  });

  it('neutralizes markup outside formatted regions', () => {
    const out = formatLabels(`Hello ${PAYLOAD}`);
    expect(out).toContain('&lt;img');
    expect(out).not.toMatch(/<[^>]*\sonerror=/);
  });

  it('neutralizes markup inside formatted regions', () => {
    const out = formatLabels(`Hello ****${PAYLOAD}****`);
    expect(out).toContain('<label>&lt;img');
    expect(out).not.toMatch(/<[^>]*\sonerror=/);
    expect(out).toContain('</label>');
  });

  it('parses adjacent regions as two runs', () => {
    expect(formatLabels('****a********b****')).toBe(
      '<label>a</label><label>b</label>'
    );
  });

  it('leaves unclosed and empty markers literal', () => {
    expect(formatLabels('a **** b')).toBe('a **** b');
    expect(formatLabels('********')).toBe('********');
  });
});
