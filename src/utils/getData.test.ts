import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Public detail read (Phase 10A): the Storage/legacy dual-read sits behind the
 * dev gate, keeps the existing PostgreSQL-only path untouched when disabled,
 * and resolves Markdown only for visible rows.
 */

const h = vi.hoisted(() => ({
  selects: [] as Array<{ table: string; columns: string }>,
  filters: [] as Array<{ table: string; op: string; column: string }>,
  row: null as Record<string, unknown> | null,
  error: null as { code?: string; message?: string } | null,
  author: null as Record<string, unknown> | null,
  downloads: [] as string[],
  objects: new Map<string, Uint8Array>(),
  cacheTags: [] as string[],
}));

vi.mock('next/cache', () => ({
  cacheLife: vi.fn(),
  cacheTag: (tag: string) => {
    h.cacheTags.push(tag);
  },
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => {
      const chain = {
        select: (columns: string) => {
          h.selects.push({ table, columns });
          return chain;
        },
        eq: (column: string) => {
          h.filters.push({ table, op: 'eq', column });
          return chain;
        },
        lte: (column: string) => {
          h.filters.push({ table, op: 'lte', column });
          return chain;
        },
        single: async () =>
          table === 'user_profiles'
            ? { data: h.author, error: null }
            : { data: h.row, error: h.error },
      };
      return chain;
    },
    storage: {
      from: (bucket: string) => ({
        download: async (path: string) => {
          h.downloads.push(`${bucket}/${path}`);
          const bytes = h.objects.get(path);
          return bytes
            ? { data: bytes, error: null }
            : { data: null, error: { message: 'Object not found' } };
        },
      }),
    },
  }),
}));

import { getPost } from '@/utils/getData';
import {
  POST_DETAIL_COLUMNS,
  POST_DETAIL_DEV_COLUMNS,
  POST_DETAIL_PORTFOLIO_COLUMNS,
  POST_DETAIL_PORTFOLIO_DEV_COLUMNS,
} from '@/utils/postProjections';

function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

const BLOG_ROW = {
  id: 7,
  created_at: '2025-01-01T00:00:00.000Z',
  title_en: 'EN title',
  title_it: 'IT title',
  description_en: 'en desc',
  description_it: 'it desc',
  body_en: '# db en',
  body_it: '# db it',
  image: 'cover.webp',
  blurhashURL: 'LEHV6nWB2yk8pyo0adR*.7kCMdnj',
  post_tags: 'tag',
  author_id: 'user-1',
};

const PORTFOLIO_ROW = {
  ...BLOG_ROW,
  id: 11,
  buttons: [{ url: 'https://example.com', kind: 'website' }],
  website: 'https://site.example',
  source_link: 'https://source.example',
  demo_link: 'https://demo.example',
  store_link: null,
  fdroid_link: null,
  ios_store_link: null,
};

beforeEach(() => {
  vi.unstubAllEnvs();
  h.selects = [];
  h.filters = [];
  h.row = { ...BLOG_ROW };
  h.error = null;
  h.author = { id: 'user-1', display_name: 'Ada', avatar_url: null };
  h.downloads = [];
  h.objects = new Map();
  h.cacheTags = [];
  vi.stubEnv('APP_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'dev_staging');
  vi.stubEnv('WS_BODY_STORAGE_READ_ENABLED', 'false');
});

describe('getPost: gate disabled (production contract)', () => {
  it('uses the existing blog projection and never touches Storage', async () => {
    const post = await getPost('7', 'blog');

    expect(h.selects).toContainEqual({
      table: 'blog_posts',
      columns: POST_DETAIL_COLUMNS,
    });
    expect(h.selects).toContainEqual({
      table: 'user_profiles',
      columns: 'id, display_name, avatar_url',
    });
    expect(h.downloads).toEqual([]);
    expect(post?.body_en).toBe('# db en');
    expect(post?.body_it).toBe('# db it');
    expect(post?.author).toEqual(h.author);
    expect(h.cacheTags).toContain('post:blog:7');
  });

  it('uses the existing portfolio projection and keeps buttons and legacy links', async () => {
    h.row = { ...PORTFOLIO_ROW };
    const post = await getPost('11', 'portfolio');

    expect(h.selects).toContainEqual({
      table: 'portfolio_posts',
      columns: POST_DETAIL_PORTFOLIO_COLUMNS,
    });
    expect(h.downloads).toEqual([]);
    const row = post as unknown as Record<string, unknown>;
    expect(row.buttons).toEqual(PORTFOLIO_ROW.buttons);
    expect(row.website).toBe('https://site.example');
    expect(row.source_link).toBe('https://source.example');
    expect(h.cacheTags).toContain('post:portfolio:11');
  });

  it('returns null for a missing post without touching Storage', async () => {
    h.error = { code: 'PGRST116', message: 'no rows' };
    const post = await getPost('7', 'blog');
    expect(post).toBeNull();
    expect(h.downloads).toEqual([]);
  });

  it('filters out hidden posts in the query', async () => {
    await getPost('7', 'blog');
    expect(h.filters).toContainEqual({
      table: 'blog_posts',
      op: 'eq',
      column: 'hidden',
    });
  });
});

describe('getPost: dev Storage dual-read enabled', () => {
  beforeEach(() => {
    vi.stubEnv('WS_BODY_STORAGE_READ_ENABLED', 'true');
  });

  it('selects the dev projection and serves verified Storage Markdown', async () => {
    const en = '# storage en 🎉';
    const it = '# storage it';
    const enPath = `blog/7/en/${sha256(en)}.md`;
    const itPath = `blog/7/it/${sha256(it)}.md`;
    h.row = {
      ...BLOG_ROW,
      body_en: en,
      body_it: it,
      body_en_path: enPath,
      body_it_path: itPath,
    };
    h.objects.set(enPath, new TextEncoder().encode(en));
    h.objects.set(itPath, new TextEncoder().encode(it));

    const post = await getPost('7', 'blog');

    expect(h.selects).toContainEqual({
      table: 'blog_posts',
      columns: POST_DETAIL_DEV_COLUMNS,
    });
    expect(h.downloads).toEqual([
      `website-content-dev/${enPath}`,
      `website-content-dev/${itPath}`,
    ]);
    expect(post?.body_en).toBe(en);
    expect(post?.body_it).toBe(it);
    // Internal pointer columns never travel to the page.
    expect(post).not.toHaveProperty('body_en_path');
    expect(post).not.toHaveProperty('body_it_path');
    expect(h.cacheTags).toContain('post:blog:7');
  });

  it('keeps the legacy body for a locale without a pointer', async () => {
    const en = '# storage only en';
    const enPath = `portfolio/11/en/${sha256(en)}.md`;
    // Both copies agree for EN; IT has no pointer and falls back to PostgreSQL.
    h.row = {
      ...PORTFOLIO_ROW,
      body_en: en,
      body_en_path: enPath,
      body_it_path: null,
    };
    h.objects.set(enPath, new TextEncoder().encode(en));

    const post = await getPost('11', 'portfolio');

    expect(h.selects).toContainEqual({
      table: 'portfolio_posts',
      columns: POST_DETAIL_PORTFOLIO_DEV_COLUMNS,
    });
    expect(post?.body_en).toBe(en);
    expect(post?.body_it).toBe('# db it');
    expect(h.downloads).toEqual([`website-content-dev/${enPath}`]);
  });

  it('never reads Storage for a hidden or missing post', async () => {
    h.error = { code: 'PGRST116', message: 'no rows' };
    const post = await getPost('7', 'blog');

    expect(post).toBeNull();
    expect(h.downloads).toEqual([]);
  });

  it('propagates an integrity failure instead of returning null or an empty body', async () => {
    const promised = '# promised';
    h.row = {
      ...BLOG_ROW,
      body_en: promised,
      body_en_path: `blog/7/en/${sha256(promised)}.md`,
      body_it_path: null,
    };
    h.objects.set(`blog/7/en/${sha256(promised)}.md`, new TextEncoder().encode('# tampered'));

    await expect(getPost('7', 'blog')).rejects.toThrow('integrity failure');
  });

  it('rejects enablement in production before querying anything', async () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'public');

    await expect(getPost('7', 'blog')).rejects.toThrow(
      'must not be enabled in production'
    );
    expect(h.selects).toEqual([]);
    expect(h.downloads).toEqual([]);
  });
});

describe('getPost: publish-date behavior', () => {
  it('applies the visibility date filter when the environment enforces it', async () => {
    // Static import cannot work here: `contentEnforcePublishDate` is computed
    // once at module load from the process env, so the enforced-date path can
    // only be exercised by re-evaluating the module after stubbing it. This is
    // a deliberate module-loading-boundary test.
    vi.resetModules();
    vi.stubEnv('CONTENT_ENFORCE_PUBLISH_DATE', 'true');
    const fresh = await import('@/utils/getData');

    await fresh.getPost('7', 'blog');

    expect(h.filters).toContainEqual({
      table: 'blog_posts',
      op: 'lte',
      column: 'created_at',
    });
    vi.unstubAllEnvs();
  });
});
