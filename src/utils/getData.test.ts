import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Public detail read: Storage is the sole body store. The read always selects
 * the canonical pointers, resolves them from the environment's content bucket
 * and hydrates `body_en`/`body_it`; hidden, missing and future-dated posts never
 * touch the bucket, and every integrity failure surfaces as an error.
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
          // Supabase Storage's download() resolves a Blob; mirror that exactly.
          // TS 7 requires an ArrayBuffer-backed BlobPart, not the Uint8Array view.
          const part = bytes?.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength
          ) as ArrayBuffer | undefined;
          return part
            ? { data: new Blob([part], { type: 'text/markdown' }), error: null }
            : { data: null, error: { message: 'Object not found' } };
        },
      }),
    },
  }),
}));

import { getPost } from '@/utils/getData';
import {
  POST_DETAIL_COLUMNS,
  POST_DETAIL_PORTFOLIO_COLUMNS,
} from '@/utils/postProjections';

function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

function pointer(
  kind: 'blog' | 'portfolio',
  id: number,
  locale: string,
  markdown: string
): string {
  return `${kind}/${id}/${locale}/${sha256(markdown)}.md`;
}

const BLOG_ROW = {
  id: 7,
  created_at: '2025-01-01T00:00:00.000Z',
  title_en: 'EN title',
  title_it: 'IT title',
  description_en: 'en desc',
  description_it: 'it desc',
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
});

describe('getPost: Storage-only blog reads', () => {
  it('selects the pointer projection and hydrates both bodies in full', async () => {
    const en = '# storage en 🎉';
    const it = '# storage it';
    const enPath = pointer('blog', 7, 'en', en);
    const itPath = pointer('blog', 7, 'it', it);
    h.row = { ...BLOG_ROW, body_en_path: enPath, body_it_path: itPath };
    h.objects.set(enPath, new TextEncoder().encode(en));
    h.objects.set(itPath, new TextEncoder().encode(it));

    const post = await getPost('7', 'blog');

    expect(h.selects).toContainEqual({
      table: 'blog_posts',
      columns: POST_DETAIL_COLUMNS,
    });
    expect(h.selects).toContainEqual({
      table: 'user_profiles',
      columns: 'id, display_name, avatar_url',
    });
    expect(h.downloads).toEqual([
      `website-content-dev/${enPath}`,
      `website-content-dev/${itPath}`,
    ]);
    expect(post?.body_en).toBe(en);
    expect(post?.body_it).toBe(it);
    expect(post?.author).toEqual(h.author);
    // Internal pointer columns never travel to the page.
    expect(post).not.toHaveProperty('body_en_path');
    expect(post).not.toHaveProperty('body_it_path');
    expect(h.cacheTags).toContain('post:blog:7');
  });

  it('never selects the retired PostgreSQL body columns', async () => {
    await getPost('7', 'blog');

    for (const { columns } of h.selects) {
      const selected = columns.split(',');
      expect(selected).not.toContain('body_en');
      expect(selected).not.toContain('body_it');
    }
  });

  it('resolves each locale independently', async () => {
    const en = '# storage only en';
    const enPath = pointer('blog', 7, 'en', en);
    // IT has no committed pointer: no object exists for it.
    h.row = { ...BLOG_ROW, body_en_path: enPath, body_it_path: null };
    h.objects.set(enPath, new TextEncoder().encode(en));

    const post = await getPost('7', 'blog');

    expect(post?.body_en).toBe(en);
    expect(post?.body_it).toBe('');
    expect(h.downloads).toEqual([`website-content-dev/${enPath}`]);
  });

  it('resolves a post with no committed pointers to empty bodies', async () => {
    h.row = { ...BLOG_ROW, body_en_path: null, body_it_path: null };

    const post = await getPost('7', 'blog');

    // A brand-new row: Storage has nothing, and there is no PostgreSQL copy
    // left to fall back to.
    expect(post?.body_en).toBe('');
    expect(post?.body_it).toBe('');
    expect(h.downloads).toEqual([]);
  });
});

describe('getPost: Storage-only portfolio reads', () => {
  it('resolves a portfolio detail through a real Blob payload', async () => {
    const en = '# blob en 🎉\r\n\r\nline two\n';
    const it = '# blob it\r\n';
    const enPath = pointer('portfolio', 11, 'en', en);
    const itPath = pointer('portfolio', 11, 'it', it);
    h.row = {
      ...PORTFOLIO_ROW,
      body_en_path: enPath,
      body_it_path: itPath,
    };
    h.objects.set(enPath, new TextEncoder().encode(en));
    h.objects.set(itPath, new TextEncoder().encode(it));

    const post = await getPost('11', 'portfolio');

    expect(h.selects).toContainEqual({
      table: 'portfolio_posts',
      columns: POST_DETAIL_PORTFOLIO_COLUMNS,
    });
    // Exact UTF-8 Markdown, including Unicode, CRLF and the final newline.
    expect(post?.body_en).toBe(en);
    expect(post?.body_it).toBe(it);
    const row = post as unknown as Record<string, unknown>;
    // Portfolio fields and the author survive the Storage read.
    expect(row.buttons).toEqual(PORTFOLIO_ROW.buttons);
    expect(row.website).toBe('https://site.example');
    expect(row.source_link).toBe('https://source.example');
    expect(row.author).toEqual(h.author);
    expect(post).not.toHaveProperty('body_en_path');
    expect(post).not.toHaveProperty('body_it_path');
    expect(h.downloads).toEqual([
      `website-content-dev/${enPath}`,
      `website-content-dev/${itPath}`,
    ]);
    expect(h.cacheTags).toContain('post:portfolio:11');
  });

  it('downloads from the production bucket for a production process', async () => {
    const en = '# prod en';
    const enPath = pointer('blog', 7, 'en', en);
    h.row = { ...BLOG_ROW, body_en_path: enPath, body_it_path: null };
    h.objects.set(enPath, new TextEncoder().encode(en));
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'public');

    const post = await getPost('7', 'blog');

    expect(post?.body_en).toBe(en);
    expect(h.downloads).toEqual([`website-content/${enPath}`]);
  });
});

describe('getPost: hidden, missing and misconfigured posts', () => {
  it('filters out hidden posts in the query and never reads Storage', async () => {
    // A hidden row is filtered by the query, so `.single()` reports no row.
    h.error = { code: 'PGRST116', message: 'no rows' };

    const post = await getPost('7', 'blog');

    expect(h.filters).toContainEqual({
      table: 'blog_posts',
      op: 'eq',
      column: 'hidden',
    });
    expect(post).toBeNull();
    expect(h.downloads).toEqual([]);
  });

  it('returns null for a missing post without touching Storage', async () => {
    h.error = { code: 'PGRST116', message: 'no rows' };
    const post = await getPost('7', 'blog');
    expect(post).toBeNull();
    expect(h.downloads).toEqual([]);
  });

  it('rejects an incompatible production pairing before querying anything', async () => {
    // production+public is the valid production pairing; a production env
    // pointed at the dev clone schema must fail closed.
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'dev_staging');

    await expect(getPost('7', 'blog')).rejects.toThrow(
      'refusing to resolve a content bucket'
    );
    expect(h.selects).toEqual([]);
    expect(h.downloads).toEqual([]);
  });
});

describe('getPost: integrity failures are never an empty body', () => {
  it('propagates a missing object', async () => {
    const en = '# promised but absent';
    h.row = {
      ...BLOG_ROW,
      body_en_path: pointer('blog', 7, 'en', en),
      body_it_path: null,
    };

    await expect(getPost('7', 'blog')).rejects.toThrow('Object not found');
  });

  it('propagates a hash mismatch', async () => {
    const promised = '# promised';
    const path = pointer('blog', 7, 'en', promised);
    h.row = { ...BLOG_ROW, body_en_path: path, body_it_path: null };
    h.objects.set(path, new TextEncoder().encode('# tampered'));

    await expect(getPost('7', 'blog')).rejects.toThrow('integrity failure');
  });

  it('propagates a malformed pointer', async () => {
    h.row = {
      ...BLOG_ROW,
      body_en_path: `blog/8/en/${sha256('# other post')}.md`,
      body_it_path: null,
    };

    await expect(getPost('7', 'blog')).rejects.toThrow('does not belong to');
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
