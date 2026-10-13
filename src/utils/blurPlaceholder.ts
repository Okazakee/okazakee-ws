/**
 * Canonical image-placeholder contract (mirrors the CMS).
 *
 * `blurhashURL` columns and `![caption-placeholder](url)` bodies hold a
 * ready-to-use Next.js `blurDataURL` (`data:image/...;base64,...`). Raw
 * BlurHash strings are legacy: they render the full image with no blur.
 * Never pass a raw hash to `next/image` as `blurDataURL`.
 */

const BLUR_DATA_URL_RE =
  /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;

export function isValidBlurPlaceholder(value: unknown): value is string {
  return typeof value === 'string' && BLUR_DATA_URL_RE.test(value);
}

/** Valid data URL or undefined: never a raw hash. */
export function resolveBlurDataURL(
  value: string | null | undefined
): string | undefined {
  return isValidBlurPlaceholder(value) ? value : undefined;
}

/**
 * Split a markdown image alt into caption + placeholder at the FIRST `-`.
 * The remainder is returned only when it is a valid data URL; legacy raw
 * hashes (which may themselves contain `-`) yield `placeholder: ''`
 * instead of a truncated fragment.
 */
export function parseBodyImageAlt(alt: string): {
  caption: string;
  placeholder: string;
} {
  const dash = alt.indexOf('-');
  if (dash < 0) return { caption: alt, placeholder: '' };
  const caption = alt.slice(0, dash);
  const raw = alt.slice(dash + 1);
  return {
    caption,
    placeholder: isValidBlurPlaceholder(raw) ? raw : '',
  };
}
