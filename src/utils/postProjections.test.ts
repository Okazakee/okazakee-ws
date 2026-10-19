import { describe, expect, it } from 'vitest';
import { cacheTags } from '@/libs/content/cacheTags';
import {
  POST_CARD_COLUMNS,
  POST_DETAIL_COLUMNS,
  POST_DETAIL_PORTFOLIO_COLUMNS,
  postListCacheTags,
} from './postProjections';

function columns(value: string): string[] {
  return value.split(',');
}

describe('POST_CARD_COLUMNS', () => {
  it('selects every field cards, sitemap and static params render', () => {
    expect(columns(POST_CARD_COLUMNS)).toEqual(
      expect.arrayContaining([
        'id',
        'title_en',
        'title_it',
        'description_en',
        'description_it',
        'image',
        'blurhashURL',
        'post_tags',
        'created_at',
      ])
    );
  });

  it('excludes bodies, pointers, views and detail-only columns', () => {
    const selected = columns(POST_CARD_COLUMNS);
    for (const absent of [
      'body_en',
      'body_it',
      'body_en_path',
      'body_it_path',
      'views',
      'hidden',
      'author_id',
      'buttons',
      'source_link',
      'demo_link',
      'store_link',
      'fdroid_link',
      'website',
      'ios_store_link',
    ]) {
      expect(selected).not.toContain(absent);
    }
    // Legacy `title` is gone too (`title_en` stays).
    expect(selected).not.toContain('title');
  });
});

describe('POST_DETAIL_COLUMNS', () => {
  it('excludes views from cached detail payloads', () => {
    expect(columns(POST_DETAIL_COLUMNS)).not.toContain('views');
    expect(columns(POST_DETAIL_PORTFOLIO_COLUMNS)).not.toContain('views');
  });

  it('names the canonical pointers and never the retired body columns', () => {
    for (const projection of [
      POST_DETAIL_COLUMNS,
      POST_DETAIL_PORTFOLIO_COLUMNS,
    ]) {
      const selected = columns(projection);
      for (const pointer of ['body_en_path', 'body_it_path']) {
        expect(selected).toContain(pointer);
      }
      // The detail payload is hydrated from Storage, so the PostgreSQL body
      // columns must not appear: the retirement drops them.
      for (const retired of ['body_en', 'body_it']) {
        expect(selected).not.toContain(retired);
      }
      expect(selected).not.toContain('*');
    }
  });

  it('keeps every field detail rendering and metadata consume', () => {
    for (const required of [
      'id',
      'created_at',
      'title_en',
      'title_it',
      'description_en',
      'description_it',
      'image',
      'blurhashURL',
      'post_tags',
      'author_id',
    ]) {
      expect(columns(POST_DETAIL_COLUMNS)).toContain(required);
    }
    for (const required of [
      'buttons',
      'website',
      'source_link',
      'demo_link',
      'store_link',
      'fdroid_link',
      'ios_store_link',
    ]) {
      expect(columns(POST_DETAIL_COLUMNS)).not.toContain(required);
      expect(columns(POST_DETAIL_PORTFOLIO_COLUMNS)).toContain(required);
    }
  });

  it('keeps the portfolio projection a superset of the shared one', () => {
    const shared = columns(POST_DETAIL_COLUMNS);
    const portfolio = columns(POST_DETAIL_PORTFOLIO_COLUMNS);
    for (const column of shared) {
      expect(portfolio).toContain(column);
    }
  });
});

describe('postListCacheTags', () => {
  it('tags blog-only lists with the blog tag', () => {
    expect(postListCacheTags('blog')).toEqual([cacheTags.blog]);
  });

  it('tags portfolio-only lists with the portfolio tag', () => {
    expect(postListCacheTags('portfolio')).toEqual([cacheTags.portfolio]);
  });

  it('keeps the shared tag for unknown list kinds', () => {
    expect(postListCacheTags('unknown')).toEqual([cacheTags.posts]);
  });

  it('only emits tags from the revalidation allowlist vocabulary', () => {
    const allowed: Set<string> = new Set([
      cacheTags.blog,
      cacheTags.portfolio,
      cacheTags.posts,
    ]);
    for (const kind of ['blog', 'portfolio', 'unknown']) {
      for (const tag of postListCacheTags(kind)) {
        expect(allowed.has(tag)).toBe(true);
      }
    }
  });
});
