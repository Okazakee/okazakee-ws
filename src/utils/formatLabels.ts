// TODO: Consolidate into a unified custom formatter that handles:
// 1. `****text****` -> violet highlight (currently produces `<label>`)
// 2. Markdown images: `![alt-blurhash](url)` split parsing
// This formatter should be shared between CMS previews and public site rendering.
import { escapeHtml } from '@/utils/escapeHtml';

export const formatLabels = (text: string) => {
  // Escape first: `*` survives escaping, so markers still parse from the
  // original input while their content can never break out as markup.
  // Never escape the generated `<label>` tags themselves.
  return escapeHtml(text).replace(
    /(\*\*\*\*([^*]+)\*\*\*\*)/g,
    (_match, _p1, p2) => {
      return `<label>${p2}</label>`;
    }
  );
};
