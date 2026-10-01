import { describe, expect, it } from 'vitest';
import { getPostHref, slugifyTitle } from './postHref';

describe('slugifyTitle', () => {
  it('lowercases and hyphenates spaces', () => {
    expect(slugifyTitle('MinePanel')).toBe('minepanel');
    expect(slugifyTitle('What a single day can do')).toBe(
      'what-a-single-day-can-do'
    );
  });

  it('drops punctuation instead of transliterating it', () => {
    expect(slugifyTitle('Dear mom...')).toBe('dear-mom');
    expect(slugifyTitle("L'avventura all'hackathon")).toBe(
      'lavventura-allhackathon'
    );
  });

  it('keeps existing hyphens and collapses repeated whitespace', () => {
    expect(slugifyTitle('self-hosted  stack')).toBe('self-hosted-stack');
  });
});

describe('getPostHref', () => {
  it('builds the locale, post type, id and slug path', () => {
    expect(
      getPostHref({
        locale: 'en',
        postType: 'portfolio',
        id: 26,
        title: 'MinePanel',
      })
    ).toBe('/en/portfolio/26/minepanel');
  });

  it('keeps the locale segment for the italian route', () => {
    expect(
      getPostHref({
        locale: 'it',
        postType: 'blog',
        id: 8,
        title: 'La mia avventura',
      })
    ).toBe('/it/blog/8/la-mia-avventura');
  });
});
