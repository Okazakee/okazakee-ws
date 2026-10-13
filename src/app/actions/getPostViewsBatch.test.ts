import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({
  calls: [] as Array<{ table: string; ids: number[] }>,
  blogRows: [] as Array<{ id: number; views: number | null }>,
  portfolioRows: [] as Array<{ id: number; views: number | null }>,
  error: null as { message: string } | null,
}));

function makeBuilder(table: string) {
  const ids: number[] = [];
  const chain = {
    select: () => chain,
    in: (_column: string, values: number[]) => {
      ids.push(...values);
      return chain;
    },
    eq: () => chain,
    // biome-ignore lint/suspicious/noThenProperty: the mock must be awaitable exactly like the supabase query builder.
    then: (resolve: (value: unknown) => void) => {
      h.calls.push({ table, ids: [...ids] });
      resolve({
        data: table === 'blog_posts' ? h.blogRows : h.portfolioRows,
        error: h.error,
      });
    },
  };
  return chain;
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => makeBuilder(table),
  }),
}));

import { getPostViewsBatch } from './getPostViewsBatch';
import { postViewsMapKey } from '@/utils/postViews';

beforeEach(() => {
  h.calls = [];
  h.blogRows = [];
  h.portfolioRows = [];
  h.error = null;
});

describe('getPostViewsBatch', () => {
  it('reads multiple blog and portfolio ids with one query per table', async () => {
    h.blogRows = [
      { id: 1, views: 10 },
      { id: 2, views: null },
    ];
    h.portfolioRows = [{ id: 9, views: 3 }];

    const result = await getPostViewsBatch([
      { postType: 'blog', id: 1 },
      { postType: 'blog', id: 2 },
      { postType: 'portfolio', id: 9 },
    ]);

    expect(result).toEqual({
      success: true,
      views: { 'blog:1': 10, 'blog:2': 0, 'portfolio:9': 3 },
    });
    expect(h.calls).toEqual([
      { table: 'blog_posts', ids: [1, 2] },
      { table: 'portfolio_posts', ids: [9] },
    ]);
  });

  it('maps EN and IT rows for the same post to one metric identity', async () => {
    h.blogRows = [{ id: 7, views: 25 }];
    const enPost = { id: 7, title_en: 'Hello', title_it: 'Ciao' };
    const itPost = { id: 7, title_en: 'Hello', title_it: 'Ciao' };

    const enKeys = [{ postType: 'blog' as const, id: enPost.id }];
    const itKeys = [{ postType: 'blog' as const, id: itPost.id }];

    const en = await getPostViewsBatch(enKeys);
    const it = await getPostViewsBatch(itKeys);

    expect(en).toEqual(it);
    expect(postViewsMapKey('blog', 7)).toBe('blog:7');
  });

  it('dedupes keys and drops invalid entries', async () => {
    h.blogRows = [{ id: 1, views: 4 }];

    const result = await getPostViewsBatch([
      { postType: 'blog', id: 1 },
      { postType: 'blog', id: 1 },
      { postType: 'portfolio', id: 1 },
      // @ts-expect-error invalid post type is dropped, not fatal
      { postType: 'video', id: 2 },
      { postType: 'blog', id: Number.NaN },
      { postType: 'blog', id: 1.5 },
    ]);

    expect(result.success).toBe(true);
    expect(h.calls).toEqual([
      { table: 'blog_posts', ids: [1] },
      { table: 'portfolio_posts', ids: [1] },
    ]);
  });

  it('answers an empty set without touching the database', async () => {
    const result = await getPostViewsBatch([]);

    expect(result).toEqual({ success: true, views: {} });
    expect(h.calls).toEqual([]);
  });

  it('fails safe when a table read fails', async () => {
    h.blogRows = [{ id: 1, views: 1 }];
    h.error = { message: 'boom' };

    const result = await getPostViewsBatch([{ postType: 'blog', id: 1 }]);

    expect(result).toEqual({ success: false, error: 'boom' });
  });
});
