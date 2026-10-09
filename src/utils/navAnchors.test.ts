import { describe, expect, it } from 'vitest';
import { createMenuItems, navItemHref, navItemIds } from '@/utils/navAnchors';

describe('createMenuItems', () => {
  it('points every link at its own section', () => {
    expect(createMenuItems('en')).toEqual([
      {
        id: 'home',
        section: 'home',
        anchor: 'home',
        route: '/en',
        page: false,
      },
      {
        id: 'skills',
        section: 'skills',
        anchor: 'skills',
        route: '/en#skills',
        page: false,
      },
      {
        id: 'career',
        section: 'career',
        anchor: 'career',
        route: '/en#career',
        page: false,
      },
      {
        id: 'portfolio',
        section: 'portfolio',
        anchor: 'portfolio',
        route: '/en/portfolio',
        page: true,
      },
      {
        id: 'blog',
        section: 'blog',
        anchor: 'blog',
        route: '/en/blog',
        page: true,
      },
      {
        id: 'contacts',
        section: 'contacts',
        anchor: 'contacts',
        route: '/en#contacts',
        page: false,
      },
    ]);
  });

  it('keeps every item id index-aligned with the nav labels', () => {
    expect(createMenuItems('en').map((item) => item.id)).toEqual([
      ...navItemIds,
    ]);
  });

  it('keeps the page items on their own routes off the home page', () => {
    const items = createMenuItems('en');
    expect(navItemHref(items[3], 'en', false)).toBe('/en/portfolio');
    expect(navItemHref(items[4], 'en', false)).toBe('/en/blog');
  });

  it('links the section items back to the home page off the home page', () => {
    const items = createMenuItems('it');
    expect(navItemHref(items[2], 'it', true)).toBe('#career');
    expect(navItemHref(items[2], 'it', false)).toBe('/it');
  });

  it('links home to the top of the page, unchanged', () => {
    const items = createMenuItems('en');
    expect(navItemHref(items[0], 'en', true)).toBe('#home');
    expect(navItemHref(items[0], 'en', false)).toBe('/en');
  });
});
