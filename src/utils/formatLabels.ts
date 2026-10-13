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
