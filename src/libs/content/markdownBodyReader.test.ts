import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  type MarkdownBodyKind,
  type MarkdownStorageApi,
  readMarkdownBodies,
  withoutBodyPointers,
} from '@/libs/content/markdownBodyReader';

/**
 * Public Markdown reader: Storage is the sole body store. The Storage surface is
 * injected, so every integrity and failure branch is exercised without network
 * access and no PostgreSQL body column exists in the contract at all.
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

describe('readMarkdownBodies: Storage-only resolution', () => {
  it('serves both locales from the bucket when both are referenced', async () => {
    const en = '# en from storage';
    const it = '# it from storage';
    const storage = makeStorage({
      [pointer('portfolio', 11, 'en', en)]: en,
      [pointer('portfolio', 11, 'it', it)]: it,
    });

    const bodies = await readMarkdownBodies({
      kind: 'portfolio',
      postId: 11,
      storage: storage.api,
      pointers: {
        en: pointer('portfolio', 11, 'en', en),
        it: pointer('portfolio', 11, 'it', it),
      },
    });

    expect(bodies).toEqual({ en, it });
    expect(storage.downloads).toHaveLength(2);
  });

  it('resolves each locale independently', async () => {
    const en = '# en from storage';
    const storage = makeStorage({ [pointer('blog', 7, 'en', en)]: en });

    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 7,
      storage: storage.api,
      pointers: { en: pointer('blog', 7, 'en', en), it: null },
    });

    // IT has no committed object, so its body is empty — never another
    // locale's Markdown and never a read of the IT locale.
    expect(bodies).toEqual({ en, it: '' });
    expect(storage.downloads).toEqual([pointer('blog', 7, 'en', en)]);
  });

  it('resolves an IT-only post without touching the EN locale', async () => {
    const it = '# solo italiano';
    const storage = makeStorage({ [pointer('blog', 3, 'it', it)]: it });

    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 3,
      storage: storage.api,
      pointers: { en: null, it: pointer('blog', 3, 'it', it) },
    });

    expect(bodies).toEqual({ en: '', it });
    expect(storage.downloads).toEqual([pointer('blog', 3, 'it', it)]);
  });

  it('returns empty bodies for a row with no committed pointers', async () => {
    const storage = makeStorage();

    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 7,
      storage: storage.api,
      pointers: NO_POINTERS,
    });

    // A brand-new row has no object yet; there is no PostgreSQL body to fall
    // back to, so "no body" is the honest answer.
    expect(bodies).toEqual({ en: '', it: '' });
    expect(storage.downloads).toEqual([]);
  });

  it('preserves exact Unicode and newlines', async () => {
    const markdown = '# Tïtolo 🎉\r\n\r\nSecondo — “virgolette”\n\n- àèìòù\n';
    const path = pointer('blog', 3, 'it', markdown);
    const storage = makeStorage({ [path]: markdown });

    const bodies = await readMarkdownBodies({
      kind: 'blog',
      postId: 3,
      storage: storage.api,
      pointers: { en: null, it: path },
    });

    expect(bodies.it).toBe(markdown);
    expect(bodies.it.length).toBe(markdown.length);
  });
});

describe('readMarkdownBodies: integrity failures', () => {
  it('throws on a missing object instead of returning an empty body', async () => {
    const storage = makeStorage();
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
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
        pointers: { en: pointer('blog', 7, 'en', '# en'), it: null },
      })
    ).rejects.toThrow('network exploded');
  });

  it('throws when the bytes do not hash to the object key', async () => {
    const promised = '# the promised content';
    const storage = makeStorage({
      [pointer('blog', 7, 'en', promised)]: '# something else',
    });

    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        pointers: { en: pointer('blog', 7, 'en', promised), it: null },
      })
    ).rejects.toThrow('integrity failure');
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
        pointers: { en: pointer('portfolio', 7, 'en', markdown), it: null },
      })
    ).rejects.toThrow('does not belong to');
  });

  it('throws when the pointer names another post id', async () => {
    const markdown = '# cross post';
    const storage = makeStorage({
      [pointer('blog', 8, 'en', markdown)]: markdown,
    });

    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        pointers: { en: pointer('blog', 8, 'en', markdown), it: null },
      })
    ).rejects.toThrow('does not belong to');
  });

  it('throws when the pointer names another locale', async () => {
    const markdown = '# cross locale';
    const storage = makeStorage({
      [pointer('blog', 7, 'it', markdown)]: markdown,
    });

    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
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
        pointers: { en: 'blog/7/en/not-a-hash.md', it: null },
      })
    ).rejects.toThrow('canonical');
  });

  it('throws on an empty pointer rather than treating it as "no body"', async () => {
    const storage = makeStorage();
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: storage.api,
        pointers: { en: '', it: null },
      })
    ).rejects.toThrow('does not belong to');
  });

  it('rejects an unsupported payload type explicitly', async () => {
    await expect(
      readMarkdownBodies({
        kind: 'blog',
        postId: 7,
        storage: makeRawStorage('# not bytes'),
        pointers: { en: pointer('blog', 7, 'en', '# not bytes'), it: null },
      })
    ).rejects.toThrow('unsupported download payload type');
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
        pointers: { en: pointer('blog', 7, 'en', promised), it: null },
      })
    ).rejects.toThrow('integrity failure');
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
