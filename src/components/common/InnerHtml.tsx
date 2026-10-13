interface InnerHtmlProps {
  /**
   * Already-safe generated HTML (e.g. `formatLabels` / `typewriterHtml`
   * output). CMS/user-controlled strings must be HTML-escaped by the
   * builder before interpolation — never pass raw external text here,
   * it renders verbatim via `dangerouslySetInnerHTML`.
   */
  html: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  className?: string;
}

export function InnerHtml({
  html,
  as: Tag = 'span',
  className,
}: InnerHtmlProps) {
  return (
    <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
