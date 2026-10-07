/**
 * Navigation anchors for the public header.
 *
 * The six nav destinations are site-side data: each link points at its own
 * section, whose `id=` attribute is what the scroll-spy and in-page scrolling
 * read. Nothing here is editor-controlled — the CMS no longer stores or edits
 * an anchor, so `anchor` always equals the item's section id.
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

export type NavMenuItem = {
  id: string;
  /** In-page section id on the home page (`home`, `skills`, ...). */
  section: string;
  /** Anchor the link points at; always the section id. */
  anchor: string;
  /** Route used when the section cannot be reached on the current page. */
  route: string;
  /** True when the item is its own page (portfolio/blog) off the home page. */
  page: boolean;
};

export function createMenuItems(locale: string): NavMenuItem[] {
  return navItemIds.map((id) => ({
    id,
    section: id,
    anchor: id,
    route:
      id === 'home'
        ? `/${locale}`
        : id === 'portfolio'
          ? `/${locale}/portfolio`
          : id === 'blog'
            ? `/${locale}/blog`
            : `/${locale}#${id}`,
    page: id === 'portfolio' || id === 'blog',
  }));
}

/**
 * The href a nav item renders. Off the home page the section items navigate
 * back to the home anchor and the two page items go to their own route;
 * `section` drives the scroll-spy and the click scroll.
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
