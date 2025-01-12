export const formatLabels = (text: string) => {
  // Replace all instances of `****...****` with `<label>...</label>`
  return text.replace(/(\*\*\*\*([^\*]+)\*\*\*\*)/g, (match, p1, p2) => {
    return `<label>${p2}</label>`;
  });
};