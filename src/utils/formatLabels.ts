const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const formatLabels = (text: string) => {
  // Escape HTML entities first, then replace ****...**** with <label>
  const escaped = escapeHtml(text);
  return escaped.replace(/(\*\*\*\*([^*]+)\*\*\*\*)/g, (_match, _p1, p2) => {
    return `<label>${p2}</label>`;
  });
};
