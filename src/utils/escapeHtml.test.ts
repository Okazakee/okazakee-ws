import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escapeHtml';

describe('escapeHtml', () => {
  it('leaves plain text unchanged', () => {
    expect(escapeHtml('Fullstack Developer 2024')).toBe(
      'Fullstack Developer 2024'
    );
    expect(escapeHtml('')).toBe('');
  });

  it('escapes every HTML-significant character', () => {
    expect(escapeHtml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&#x27;');
  });

  it('neutralizes an event-handler payload', () => {
    expect(
      escapeHtml('<img src=x onerror="document.documentElement.dataset.xss=\'1\'">')
    ).toBe(
      '&lt;img src=x onerror=&quot;document.documentElement.dataset.xss=&#x27;1&#x27;&quot;&gt;'
    );
  });

  it('leaves asterisks untouched for marker parsing', () => {
    expect(escapeHtml('****text****')).toBe('****text****');
  });
});
