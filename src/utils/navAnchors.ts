/**
 * Navigation anchors for the public header.
 *
 * The six nav destinations are fixed site-side (their routes and the section
 * ids the scroll-spy reads are NOT editor-controlled); only the anchor each
 * link points at is CMS-editable, stored as an ordered jsonb array of
 * `{ id, anchor }` on the single-row `site_settings` table. The array is
 * written index-aligned with `header.buttons.N`, but it is read by `id` so a
 * hand-edited or reordered row still lands on the right item.
 *
 * A missing/blank anchor means "never arranged": the anchor falls back to the
 * section id, which reproduces the URL this header has always rendered.
 */

/** Nav item ids, in render order — index-aligned with `header.buttons.N`. */
export const navItemIds = [
  'home',
  'skills',
  'career',
  'portfolio',
  'blog',
  'contacts',
] as const;

export type NavItemId = (typeof navItemIds)[number];

/** One stored `{ id, anchor }` entry, as read from `site_settings`. */
export type NavAnchorEntry = { id: string; anchor?: string | null };

/**
 * A fragment-safe anchor: no leading `#`, no URL/query characters. Anything
 * else (a path, a full URL, whitespace) is treated as never arranged so the
 * stored value can never produce a broken href.
 */
export function normalizeNavAnchor(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().replace(/^#+/, '');
  if (!trimmed) return null;
  return /^[A-Za-z][A-Za-z0-9_-]*$/.test(trimmed) ? trimmed : null;
}

/**
 * Reads the stored jsonb into one anchor per nav item, positionally aligned
 * with `navItemIds`. Unknown ids and unusable anchors keep the default.
 */
export function parseNavAnchors(value: unknown): string[] {
  const anchors: string[] = [...navItemIds];
  if (!Array.isArray(value)) return anchors;

  for (const entry of value as NavAnchorEntry[]) {
    if (!entry || typeof entry !== 'object') continue;
    const index = navItemIds.indexOf(String(entry.id) as NavItemId);
    if (index < 0) continue;
    const anchor = normalizeNavAnchor(entry.anchor);
    if (anchor) anchors[index] = anchor;
  }

  return anchors;
}

export type NavMenuItem = {
  id: string;
  /** In-page section id on the home page (`home`, `skills`, ...). */
  section: string;
  /** Anchor the link points at; editor-controlled, defaults to `section`. */
  anchor: string;
  /** Route used when the section cannot be reached on the current page. */
  route: string;
  /** True when the item is its own page (portfolio/blog) off the home page. */
  page: boolean;
};

export function createMenuItems(
  locale: string,
  anchors: readonly string[]
): NavMenuItem[] {
  return navItemIds.map((id, index) => {
    const anchor = anchors[index] || id;
    return {
      id,
      section: id,
      anchor,
      route:
        id === 'home'
          ? `/${locale}`
          : id === 'portfolio'
            ? `/${locale}/portfolio`
            : id === 'blog'
              ? `/${locale}/blog`
              : `/${locale}#${anchor}`,
      page: id === 'portfolio' || id === 'blog',
    };
  });
}

/**
 * The href a nav item renders. Off the home page the section items navigate
 * back to the home anchor and the two page items go to their own route;
 * `section` (not `anchor`) still drives the scroll-spy and the click scroll,
 * so an edited anchor never breaks in-page navigation.
 */
export function navItemHref(
  item: NavMenuItem,
  locale: string,
  isHomePage: boolean
): string {
  if (isHomePage) return `#${item.anchor}`;
  if (item.page) return item.route;
  return `/${locale}`;
}
