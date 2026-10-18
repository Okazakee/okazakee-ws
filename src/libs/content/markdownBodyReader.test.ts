import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  type MarkdownBodyKind,
  type MarkdownStorageApi,
  readMarkdownBodies,
  withoutBodyPointers,
} from '@/libs/content/markdownBodyReader';

/**
 * Public Markdown reader (Phase 10A). The Storage surface is injected, so every
 * integrity and failure branch is exercised without network access.
 */

type Locale = 'en' | 'it';

function sha256(text: string): string {
  return createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex');
}

function pointer(
  kind: MarkdownBodyKind,
  id: number,
  locale: Locale,
  markdown: string
): string {
  return `${kind}/${id}/${locale}/${sha256(markdown)}.md`;
}

type PayloadKind = 'buffer' | 'uint8' | 'arraybuffer' | 'blob';

/** Supabase Storage's `download()` returns a Blob; the others stay supported. */
function toPayload(text: string, kind: PayloadKind): unknown {
  const bytes = Buffer.from(text, 'utf8');
  if (kind === 'uint8') return new Uint8Array(bytes);
  if (kind === 'arraybuffer') {
    return bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    );
  }
  if (kind === 'blob') {
    // TS 7 requires an ArrayBuffer-backed BlobPart, not the Uint8Array view.
    const part = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    return new Blob([part], { type: 'text/markdown' });
  }
  return bytes;
}

function makeStorage(
  objects: Record<string, string> = {},
  failure?: string,
  kind: PayloadKind = 'buffer'
): { api: MarkdownStorageApi; downloads: string[] } {
  const downloads: string[] = [];
  return {
    downloads,
    api: {
      download: async (path: string) => {
        downloads.push(path);
        if (failure) return { data: null, error: { message: failure } };
        const stored = objects[path];
        if (stored === undefined) {
          return { data: null, error: { message: 'Object not found' } };
        }
        return { data: toPayload(stored, kind), error: null };
      },
    },
  };
}

/** Storage that hands back a payload the reader must reject explicitly. */
function makeRawStorage(payload: unknown): MarkdownStorageApi {
  return { download: async () => ({ data: payload, error: null }) };
}

const NO_POINTERS = { en: null, it: null };

describe('readMarkdownBodies: legacy fallback', () => {
  it('returns both legacy bodies without touching Storage', async () => {
    const storage = makeStorage();
    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 7,
      storage: storage.api,
      legacy: { en: '# en from db', it: '# it from db' },
      pointers: NO_POINTERS,
    });
    expect(bodies).toEqual({ en: '# en from db', it: '# it from db' });
    expect(storage.downloads).toEqual([]);
  });

  it('uses the legacy column for the locale without a pointer', async () => {
    const en = '# en from storage';
    const storage = makeStorage({ [pointer('blog', 7, 'en', en)]: en });
    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 7,
      storage: storage.api,
      legacy: { en, it: '# it from db' },
      pointers: { en: pointer('blog', 7, 'en', en), it: null },
    });
    expect(bodies).toEqual({ en, it: '# it from db' });
    expect(storage.downloads).toHaveLength(1);
  });

  it('uses the legacy column for EN when only IT has a pointer', async () => {
    const it = '# it from storage';
    const storage = makeStorage({ [pointer('blog', 7, 'it', it)]: it });
    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 7,
      storage: storage.api,
      legacy: { en: '# en from db', it },
      pointers: { en: null, it: pointer('blog', 7, 'it', it) },
    });
    expect(bodies).toEqual({ en: '# en from db', it });
  });

  it('serves both locales from Storage when both are referenced', async () => {
    const en = '# en storage';
    const it = '# it storage';
    const storage = makeStorage({
      [pointer('portfolio', 11, 'en', en)]: en,
      [pointer('portfolio', 11, 'it', it)]: it,
    });
    const bodies = await readMarkdownBodies({
      kind: 'portfolio',
      postId: 11,
      storage: storage.api,
      legacy: { en, it },
      pointers: {
        en: pointer('portfolio', 11, 'en', en),
        it: pointer('portfolio', 11, 'it', it),
      },
    });
    expect(bodies).toEqual({ en, it });
  });

  it('preserves exact Unicode and newlines', async () => {
    const markdown = '# Tïtolo 🎉\r\n\r\nSecondo — “virgolette”\n\n- àèìòù\n';
    const storage = makeStorage({ [pointer('blog', 3, 'it', markdown)]: markdown });
    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 3,
      storage: storage.api,
      legacy: { en: null, it: markdown },
      pointers: { en: null, it: pointer('blog', 3, 'it', markdown) },
    });
    expect(bodies.it).toBe(markdown);
    expect(bodies.it.length).toBe(markdown.length);
  });
});

describe('readMarkdownBodies: integrity failures', () => {
  it('throws when a pointer exists but Storage reads are disabled', async () => {
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: null,
        legacy: { en: '# en', it: null },
        pointers: { en: pointer('blog', 7, 'en', '# en'), it: null },
      })
    ).rejects.toThrow('Storage reads are disabled');
  });

  it('throws on a missing object instead of falling back to the legacy body', async () => {
    const storage = makeStorage();
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: '# en', it: null },
        pointers: { en: pointer('blog', 7, 'en', '# en'), it: null },
      })
    ).rejects.toThrow('Object not found');
  });

  it('throws on a download failure', async () => {
    const storage = makeStorage({}, 'network exploded');
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: '# en', it: null },
        pointers: { en: pointer('blog', 7, 'en', '# en'), it: null },
      })
    ).rejects.toThrow('network exploded');
  });

  it('throws when the bytes do not hash to the object key', async () => {
    const promised = '# the promised content';
    const tampered = '# something else';
    const storage = makeStorage({ [pointer('blog', 7, 'en', promised)]: tampered });
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: promised, it: null },
        pointers: { en: pointer('blog', 7, 'en', promised), it: null },
      })
    ).rejects.toThrow('integrity failure');
  });

  it('throws when the pointer names another post id', async () => {
    const markdown = '# cross post';
    const storage = makeStorage({ [pointer('blog', 8, 'en', markdown)]: markdown });
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: markdown, it: null },
        pointers: { en: pointer('blog', 8, 'en', markdown), it: null },
      })
    ).rejects.toThrow('does not belong to');
  });

  it('throws when the pointer names another entity', async () => {
    const markdown = '# cross entity';
    const storage = makeStorage({
      [pointer('portfolio', 7, 'en', markdown)]: markdown,
    });
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: markdown, it: null },
        pointers: { en: pointer('portfolio', 7, 'en', markdown), it: null },
      })
    ).rejects.toThrow('does not belong to');
  });

  it('throws when the pointer names another locale', async () => {
    const markdown = '# cross locale';
    const storage = makeStorage({ [pointer('blog', 7, 'it', markdown)]: markdown });
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: markdown, it: null },
        pointers: { en: pointer('blog', 7, 'it', markdown), it: null },
      })
    ).rejects.toThrow('does not belong to');
  });

  it('throws on a non-canonical key', async () => {
    const storage = makeStorage();
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: '# en', it: null },
        pointers: { en: 'blog/7/en/not-a-hash.md', it: null },
      })
    ).rejects.toThrow('canonical');
  });

  it('throws when Storage and the legacy body disagree', async () => {
    const stored = '# storage version';
    const legacy = '# database version';
    const storage = makeStorage({ [pointer('blog', 7, 'en', stored)]: stored });
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: legacy, it: null },
        pointers: { en: pointer('blog', 7, 'en', stored), it: null },
      })
    ).rejects.toThrow('disagreement');
  });
});

describe('readMarkdownBodies: payload shapes', () => {
  const markdown = '# from storage 🎉\r\n\r\nsecond line\n';

  it.each(['blob', 'buffer', 'uint8', 'arraybuffer'] as const)(
    'accepts a %s payload and verifies the raw bytes',
    async (kind) => {
      const path = pointer('blog', 7, 'en', markdown);
      const storage = makeStorage({ [path]: markdown }, undefined, kind);

      const bodies = await readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: markdown, it: null },
        pointers: { en: path, it: null },
      });

      expect(bodies.en).toBe(markdown);
      expect(bodies.en.length).toBe(markdown.length);
    }
  );

  it('rejects a Blob whose bytes do not hash to the object key', async () => {
    const promised = '# the promised content';
    const storage = makeStorage(
      { [pointer('blog', 7, 'en', promised)]: '# tampered in a blob' },
      undefined,
      'blob'
    );

    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: promised, it: null },
        pointers: { en: pointer('blog', 7, 'en', promised), it: null },
      })
    ).rejects.toThrow('integrity failure');
  });

  it('rejects a valid Blob that disagrees with the legacy body', async () => {
    const stored = '# storage version';
    const storage = makeStorage(
      { [pointer('blog', 7, 'en', stored)]: stored },
      undefined,
      'blob'
    );

    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        legacy: { en: '# database version', it: null },
        pointers: { en: pointer('blog', 7, 'en', stored), it: null },
      })
    ).rejects.toThrow('disagreement');
  });

  it('rejects an unsupported payload type explicitly', async () => {
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: makeRawStorage('# not bytes'),
        legacy: { en: null, it: null },
        pointers: { en: pointer('blog', 7, 'en', '# not bytes'), it: null },
      })
    ).rejects.toThrow('unsupported download payload type');
  });
});

describe('withoutBodyPointers', () => {
  it('drops the internal pointer columns and keeps the metadata', () => {
    const row = {
      id: 7,
      title_en: 'T',
      body_en: '# en',
      body_en_path: 'blog/7/en/x.md',
      body_it_path: 'blog/7/it/y.md',
    };
    const clean = withoutBodyPointers(row);
    expect(Object.keys(clean).sort()).toEqual(['body_en', 'id', 'title_en']);
    expect(clean.body_en).toBe('# en');
    // The source row is untouched.
    expect(row.body_en_path).toBe('blog/7/en/x.md');
  });
});
