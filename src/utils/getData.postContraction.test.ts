import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Public detail read (`getPost`) against a schema where `body_en` / `body_it` do
 * not exist.
 *
 * The neighbouring `getData.test.ts` drives the same read path, but its Supabase
 * mock returns a fixed row whatever the select string says, so a projection that
 * still named a retired column would pass there. Here the mock is SCHEMA-AWARE:
 * it carries an explicit post-contraction column catalogue and validates every
 * projection and filter against it, so naming `body_en` / `body_it` fails the
 * way it fails in production (PostgREST `42703`) and the read throws.
 *
 * `legacy-present` is the negative control: the same reads run against a
 * catalogue that still has the columns (and rows that still carry legacy
 * values), which is what proves the assertions below describe the code's
 * behaviour rather than a mock that cannot name the columns.
 */

type Row = Record<string, unknown>;

type Statement = {
  table: string;
  projection: string;
  filterColumns: string[];
  errorCode: string | null;
};

/** Tables and columns the post-contraction Data API exposes to this read. */
const POST_CONTRACTION_CATALOGUE: Record<string, string[]> = {
  blog_posts: [
    'id',
    'created_at',
    'title_en',
    'title_it',
    'description_en',
    'description_it',
    'body_en_path',
    'body_it_path',
    'image',
    'blurhashURL',
    'post_tags',
    'author_id',
    'hidden',
  ],
  portfolio_posts: [
    'id',
    'created_at',
    'title_en',
    'title_it',
    'description_en',
    'description_it',
    'body_en_path',
    'body_it_path',
    'image',
    'blurhashURL',
    'post_tags',
    'author_id',
    'hidden',
    'buttons',
    'website',
    'source_link',
    'demo_link',
    'store_link',
    'fdroid_link',
    'ios_store_link',
  ],
  user_profiles: ['id', 'display_name', 'avatar_url'],
};

const RETIRED_COLUMNS = ['body_en', 'body_it'] as const;

/** Negative control: the same catalogue with the retired columns still present. */
const LEGACY_CATALOGUE: Record<string, string[]> = {
  ...POST_CONTRACTION_CATALOGUE,
  blog_posts: [...POST_CONTRACTION_CATALOGUE.blog_posts, ...RETIRED_COLUMNS],
  portfolio_posts: [
    ...POST_CONTRACTION_CATALOGUE.portfolio_posts,
    ...RETIRED_COLUMNS,
  ],
};

const h = vi.hoisted(() => {
  const state = {
    catalogue: {} as Record<string, string[]>,
    rows: {} as Record<string, Array<Record<string, unknown>>>,
    objects: new Map<string, Uint8Array>(),
    statements: [] as Statement[],
    downloads: [] as string[],
  };

  const error = (code: string, message: string) => ({
    code,
    message,
    details: null,
    hint: null,
  });

  /** PostgREST rejects an unknown column before it can return anything. */
  const columnError = (table: string, column: string) => {
    const columns = state.catalogue[table];
    if (!columns) {
      return error(
        'PGRST205',
        `Could not find the table 'public.${table}' in the schema cache`
      );
    }
    if (!columns.includes(column)) {
      return error('42703', `column ${table}.${column} does not exist`);
    }
    return null;
  };

  const builder = (table: string) => {
    let projection = '*';
    const filterColumns: string[] = [];
    const filters: Array<(row: Record<string, unknown>) => boolean> = [];
    const statement: Statement = {
      table,
      projection,
      filterColumns,
      errorCode: null,
    };

    const run = async () => {
      state.statements.push(statement);
      const named =
        projection === '*'
          ? []
          : projection.split(',').map((column) => column.trim());
      for (const column of [...named, ...filterColumns]) {
        const failure = columnError(table, column);
        if (failure) {
          statement.errorCode = failure.code;
          return { data: null, error: failure };
        }
      }
      const matched = (state.rows[table] ?? []).filter((row) =>
        filters.every((filter) => filter(row))
      );
      if (matched.length !== 1) {
        statement.errorCode = 'PGRST116';
        return {
          data: null,
          error: error(
            'PGRST116',
            'JSON object requested, multiple (or no) rows returned'
          ),
        };
      }
      return { data: matched[0], error: null };
    };

    const chain = {
      select(columns = '*') {
        projection = columns;
        statement.projection = columns;
        return chain;
      },
      eq(column: string, value: unknown) {
        filterColumns.push(column);
        // PostgREST sends `id=eq.7` as text and Postgres casts it to the
        // column's type, so a numeric row value matches its string spelling.
        filters.push((row) => {
          const actual = row[column];
          if (actual === value) return true;
          return (
            typeof actual === 'number' &&
            typeof value === 'string' &&
            value !== '' &&
            Number(actual) === Number(value)
          );
        });
        return chain;
      },
      lte(column: string, value: unknown) {
        filterColumns.push(column);
        filters.push((row) => String(row[column]) <= String(value));
        return chain;
      },
      /** The detail read only ever requests one row. */
      async single() {
        return run();
      },
    };
    return chain;
  };

  const client = () => ({
    from: (table: string) => builder(table),
    storage: {
      from: (bucket: string) => ({
        async download(path: string) {
          state.downloads.push(`${bucket}/${path}`);
          const stored = state.objects.get(path);
          if (!stored)
            return { data: null, error: { message: 'Object not found' } };
          // Supabase Storage resolves a Blob; mirror that shape exactly.
          const part = stored.buffer.slice(
            stored.byteOffset,
            stored.byteOffset + stored.byteLength
          ) as ArrayBuffer;
          return { data: new Blob([part]), error: null };
        },
      }),
    },
  });

  return { state, client };
});

vi.mock('next/cache', () => ({ cacheLife: vi.fn(), cacheTag: vi.fn() }));
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => h.client(),
}));

import { getPost } from '@/utils/getData';

const BLOG_ID = 7;
const PORTFOLIO_ID = 11;
const BLOG_EN = '# storage blog en 🎉\n\nsecond line\n';
const BLOG_IT = '# storage blog it\n\nseconda riga\n';
const PORTFOLIO_EN = '# storage portfolio en\n';
const PORTFOLIO_IT = '# storage portfolio it\n';
const AUTHOR = { id: 'user-1', display_name: 'Ada', avatar_url: null };

function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

function pointerPath(
  kind: 'blog' | 'portfolio',
  id: number,
  locale: 'en' | 'it',
  markdown: string
): string {
  return `${kind}/${id}/${locale}/${sha256(markdown)}.md`;
}

const BLOG_EN_PATH = pointerPath('blog', BLOG_ID, 'en', BLOG_EN);
const BLOG_IT_PATH = pointerPath('blog', BLOG_ID, 'it', BLOG_IT);
const PORTFOLIO_EN_PATH = pointerPath(
  'portfolio',
  PORTFOLIO_ID,
  'en',
  PORTFOLIO_EN
);
const PORTFOLIO_IT_PATH = pointerPath(
  'portfolio',
  PORTFOLIO_ID,
  'it',
  PORTFOLIO_IT
);

function blogRow(legacyValues: boolean): Row {
  return {
    id: BLOG_ID,
    created_at: '2025-01-01T00:00:00.000Z',
    title_en: 'Blog EN',
    title_it: 'Blog IT',
    description_en: 'en description',
    description_it: 'it description',
    body_en_path: BLOG_EN_PATH,
    body_it_path: BLOG_IT_PATH,
    image: 'cover.webp',
    blurhashURL: '',
    post_tags: '',
    author_id: AUTHOR.id,
    hidden: false,
    // Legacy copies, present only where the column still exists.
    ...(legacyValues
      ? { body_en: '# legacy column EN', body_it: '# legacy column IT' }
      : {}),
  };
}

function portfolioRow(legacyValues: boolean): Row {
  return {
    id: PORTFOLIO_ID,
    created_at: '2025-01-01T00:00:00.000Z',
    title_en: 'Project',
    title_it: 'Progetto',
    description_en: 'en description',
    description_it: 'it description',
    body_en_path: PORTFOLIO_EN_PATH,
    body_it_path: PORTFOLIO_IT_PATH,
    image: 'cover.webp',
    blurhashURL: '',
    post_tags: '',
    author_id: AUTHOR.id,
    hidden: false,
    buttons: null,
    website: 'https://example.com',
    source_link: null,
    demo_link: null,
    store_link: null,
    fdroid_link: null,
    ios_store_link: null,
    ...(legacyValues
      ? { body_en: '# legacy column EN', body_it: '# legacy column IT' }
      : {}),
  };
}

/** Exact retired-column names in a statement, never `body_<locale>_path`. */
function retiredColumnNames(statements: readonly Statement[]): string[] {
  const names: string[] = [];
  for (const statement of statements) {
    const columns = [
      ...statement.projection.split(',').map((column) => column.trim()),
      ...statement.filterColumns,
    ];
    for (const column of columns) {
      if ((RETIRED_COLUMNS as readonly string[]).includes(column)) {
        names.push(`${statement.table}.${column}`);
      }
    }
  }
  return names;
}

function prepareScenario(options: {
  legacyColumns: boolean;
}): Array<[string, string]> {
  h.state.statements.length = 0;
  h.state.downloads.length = 0;
  h.state.objects = new Map();
  h.state.catalogue = options.legacyColumns
    ? LEGACY_CATALOGUE
    : POST_CONTRACTION_CATALOGUE;
  h.state.rows = {
    blog_posts: [blogRow(options.legacyColumns)],
    portfolio_posts: [portfolioRow(options.legacyColumns)],
    user_profiles: [AUTHOR],
  };
  const objects: Array<[string, string]> = [
    [BLOG_EN_PATH, BLOG_EN],
    [BLOG_IT_PATH, BLOG_IT],
    [PORTFOLIO_EN_PATH, PORTFOLIO_EN],
    [PORTFOLIO_IT_PATH, PORTFOLIO_IT],
  ];
  for (const [path, markdown] of objects) {
    h.state.objects.set(path, new TextEncoder().encode(markdown));
  }
  return objects;
}

beforeEach(() => {
  vi.unstubAllEnvs();
  vi.stubEnv('APP_ENV', 'development');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'dev_staging');
});

const SHAPES = [
  { shape: 'the legacy columns are gone', legacyColumns: false },
  // Negative control: the columns are still there (release-plan step 5).
  { shape: 'the legacy columns still exist', legacyColumns: true },
];

describe.each(SHAPES)('detail read when $shape', ({ legacyColumns }) => {
  beforeEach(() => {
    prepareScenario({ legacyColumns });
  });

  it('hydrates both blog locales from the content bucket', async () => {
    const post = await getPost(String(BLOG_ID), 'blog');

    // The body comes from Storage, never from a legacy column copy — even when
    // the row still carries one.
    expect(post?.body_en).toBe(BLOG_EN);
    expect(post?.body_it).toBe(BLOG_IT);
    expect(post?.body_en).not.toBe('# legacy column EN');
    expect(post).not.toHaveProperty('body_en_path');
    expect(post).not.toHaveProperty('body_it_path');
    expect(post?.author).toEqual(AUTHOR);
    expect(h.state.downloads).toEqual([
      `website-content-dev/${BLOG_EN_PATH}`,
      `website-content-dev/${BLOG_IT_PATH}`,
    ]);
  });

  it('hydrates both portfolio locales, pointer columns stripped', async () => {
    const post = await getPost(String(PORTFOLIO_ID), 'portfolio');

    expect(post?.body_en).toBe(PORTFOLIO_EN);
    expect(post?.body_it).toBe(PORTFOLIO_IT);
    expect(post).not.toHaveProperty('body_en_path');
    expect(post).not.toHaveProperty('body_it_path');
    expect(h.state.downloads).toEqual([
      `website-content-dev/${PORTFOLIO_EN_PATH}`,
      `website-content-dev/${PORTFOLIO_IT_PATH}`,
    ]);
  });

  it('names a retired column in no statement it executes', async () => {
    await getPost(String(BLOG_ID), 'blog');
    await getPost(String(PORTFOLIO_ID), 'portfolio');

    expect(h.state.statements.length).toBeGreaterThan(1);
    expect(retiredColumnNames(h.state.statements)).toEqual([]);
    // The pointer projection really is what ran, so the assertion above covers
    // a real detail read rather than an empty statement log.
    const blogSelect = h.state.statements.find(
      (statement) => statement.table === 'blog_posts'
    );
    expect(blogSelect?.projection).toContain('body_en_path');
    expect(blogSelect?.projection).toContain('body_it_path');
    expect(blogSelect?.errorCode).toBeNull();
  });

  it('resolves the production content bucket for a production process', async () => {
    vi.stubEnv('APP_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_DB_SCHEMA', 'public');

    const post = await getPost(String(BLOG_ID), 'blog');

    expect(post?.body_en).toBe(BLOG_EN);
    expect(h.state.downloads).toEqual([
      `website-content/${BLOG_EN_PATH}`,
      `website-content/${BLOG_IT_PATH}`,
    ]);
  });
});

describe('schema enforcement (so the assertions above are not vacuous)', () => {
  it('fails a projection that names a retired column', async () => {
    prepareScenario({ legacyColumns: false });

    const result = await h
      .client()
      .from('blog_posts')
      .select('id, body_en')
      .eq('id', BLOG_ID)
      .single();

    expect(result.error?.code).toBe('42703');
    expect(result.error?.message).toContain('body_en');
    // The recorder sees it too, so `retiredColumnNames` is a live detector.
    expect(retiredColumnNames(h.state.statements)).toEqual([
      'blog_posts.body_en',
    ]);
  });

  it('throws the projection failure through the real read path', async () => {
    prepareScenario({ legacyColumns: true });
    // Hide the pointer columns from the catalogue: the read then has no way to
    // succeed, and the failure must surface instead of being swallowed.
    h.state.catalogue = {
      ...LEGACY_CATALOGUE,
      blog_posts: LEGACY_CATALOGUE.blog_posts.filter(
        (column) => column !== 'body_en_path'
      ),
    };

    await expect(getPost(String(BLOG_ID), 'blog')).rejects.toThrow(
      'body_en_path'
    );
    expect(h.state.downloads).toEqual([]);
  });
});
