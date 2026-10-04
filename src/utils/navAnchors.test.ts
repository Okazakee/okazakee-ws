import { describe, expect, it } from 'vitest';
import {
  createMenuItems,
  navItemHref,
  navItemIds,
  normalizeNavAnchor,
  parseNavAnchors,
} from '@/utils/navAnchors';

const defaults = parseNavAnchors(null);

describe('normalizeNavAnchor', () => {
  it('accepts a fragment-safe element id, with or without a leading hash', () => {
    expect(normalizeNavAnchor('career')).toBe('career');
    expect(normalizeNavAnchor('#career')).toBe('career');
    expect(normalizeNavAnchor('  work-history  ')).toBe('work-history');
  });

  it('rejects anything that could not be an element id', () => {
    expect(normalizeNavAnchor('')).toBeNull();
    expect(normalizeNavAnchor('   ')).toBeNull();
    expect(normalizeNavAnchor('#')).toBeNull();
    expect(normalizeNavAnchor('/career')).toBeNull();
    expect(normalizeNavAnchor('https://example.test/x')).toBeNull();
    expect(normalizeNavAnchor('two words')).toBeNull();
    expect(normalizeNavAnchor('1st')).toBeNull();
    expect(normalizeNavAnchor(null)).toBeNull();
    expect(normalizeNavAnchor(42)).toBeNull();
  });
});

describe('parseNavAnchors', () => {
  it('falls back to the item ids when nothing is stored', () => {
    expect(parseNavAnchors(null)).toEqual([
      'home',
      'skills',
      'career',
      'portfolio',
      'blog',
      'contacts',
    ]);
    expect(parseNavAnchors(undefined)).toEqual(defaults);
    expect(parseNavAnchors([])).toEqual(defaults);
    expect(parseNavAnchors('not an array')).toEqual(defaults);
  });

  it('reads stored anchors by id, not by array position', () => {
    const anchors = parseNavAnchors([
      { id: 'contacts', anchor: 'reach-out' },
      { id: 'skills', anchor: 'toolbox' },
    ]);
    expect(anchors).toEqual([
      'home',
      'toolbox',
      'career',
      'portfolio',
      'blog',
      'reach-out',
    ]);
  });

  it('ignores unknown ids and unusable anchors', () => {
    const anchors = parseNavAnchors([
      { id: 'not-a-nav-item', anchor: 'nope' },
      { id: 'blog', anchor: '/blog' },
      { id: 'career', anchor: null },
      { id: 'home', anchor: 'top' },
      null,
    ]);
    expect(anchors).toEqual([
      'top',
      'skills',
      'career',
      'portfolio',
      'blog',
      'contacts',
    ]);
  });
});

describe('createMenuItems', () => {
  it('reproduces the pre-CMS items when no anchor is stored', () => {
    expect(createMenuItems('en', defaults)).toEqual([
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
    expect(createMenuItems('en', defaults).map((item) => item.id)).toEqual([
      ...navItemIds,
    ]);
  });

  it('applies stored anchors to the href while the section id is untouched', () => {
    const anchors = parseNavAnchors([{ id: 'career', anchor: 'work-history' }]);
    const items = createMenuItems('it', anchors);
    const career = items[2];

    // The scroll-spy and the click handler read `section`; it must not move.
    expect(career.section).toBe('career');
    expect(navItemHref(career, 'it', true)).toBe('#work-history');
    // Off the home page the item navigates back to that anchor.
    expect(career.route).toBe('/it#work-history');
    expect(navItemHref(career, 'it', false)).toBe('/it');
  });

  it('keeps the page items on their own routes off the home page', () => {
    const items = createMenuItems('en', parseNavAnchors(null));
    expect(navItemHref(items[3], 'en', false)).toBe('/en/portfolio');
    expect(navItemHref(items[4], 'en', false)).toBe('/en/blog');
  });

  it('links home to the top of the page, unchanged', () => {
    const items = createMenuItems('en', parseNavAnchors(null));
    expect(navItemHref(items[0], 'en', true)).toBe('#home');
    expect(navItemHref(items[0], 'en', false)).toBe('/en');
  });
});
