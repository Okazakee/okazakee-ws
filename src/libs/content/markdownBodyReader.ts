/**
 * Server-only Markdown reader for the public site.
 *
 * Supabase Storage is the SOLE authoritative store for post bodies: every
 * locale is resolved from the private content bucket named by its committed
 * content-addressed pointer. The PostgreSQL `body_en`/`body_it` columns are
 * never read — they no longer exist once the retirement is applied — and there
 * is no fallback, no agreement check against them and no empty-body default.
 *
 * The Storage surface is INJECTED (a bucket-scoped `storage.from(bucket)`), so
 * integrity and failure behaviour is testable without network access, and this
 * module never constructs credentials or resolves a bucket.
 *
 * Contract per locale:
 * - NULL pointer     -> `''`: the row genuinely has no body committed yet (a
 *                       row only gets its canonical key after its first save
 *                       with content, and the columns stay nullable for that
 *                       reason). There is no PostgreSQL copy to consult.
 * - pointer          -> download, verify the raw bytes hash to the SHA-256
 *                       embedded in the canonical key, and return the exact
 *                       UTF-8 bytes;
 * - missing/unreadable/mismatched/non-canonical -> error, never an empty
 *   document and never another locale's or post's content.
 *
 * The exact UTF-8 bytes are the identity: no trimming, no newline or Unicode
 * normalization.
 */
import { createHash } from 'node:crypto';

export type MarkdownBodyKind = 'blog' | 'portfolio';
export type MarkdownBodyLocale = 'en' | 'it';

const BODY_LOCALES: readonly MarkdownBodyLocale[] = ['en', 'it'];

/**
 * The bucket-scoped Storage operations this module needs.
 * `supabase.storage.from(bucket)` satisfies it structurally.
 */
export type MarkdownStorageApi = {
  download(
    path: string
  ): Promise<{ data: unknown | null; error: unknown | null }>;
};

export type ReadMarkdownBodiesArgs = {
  kind: MarkdownBodyKind;
  postId: number;
  /** Bucket-scoped Storage API for the environment's content bucket. */
  storage: MarkdownStorageApi;
  /** Committed content-addressed pointers; NULL means "no body committed". */
  pointers: { en: string | null; it: string | null };
};

export type ResolvedMarkdownBodies = { en: string; it: string };

function messageOf(error: unknown): string {
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }
  return String(error);
}

/**
 * Coerces a Storage download payload to raw bytes.
 *
 * Supabase Storage's `download()` returns a Blob, so that is the normal shape in
 * production; Buffer/Uint8Array/ArrayBuffer stay supported for the injected
 * fake and for runtimes that hand back an ArrayBuffer. The bytes are always the
 * ones hashed — never the text — so a tampered object cannot pass verification.
 */
async function payloadToBytes(data: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(data)) return data;
  if (data instanceof Uint8Array) return Buffer.from(data);
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  if (data instanceof Blob) return Buffer.from(await data.arrayBuffer());
  throw new Error('[ws-body] unsupported download payload type');
}

function sha256Hex(bytes: Buffer | Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Canonical key prefix for one locale of one post. A pointer that names another
 * entity, post id or locale is rejected rather than trusted.
 */
function pointerPrefix(
  kind: MarkdownBodyKind,
  postId: number,
  locale: MarkdownBodyLocale
): string {
  return `${kind}/${postId}/${locale}/`;
}

function expectedHashFromPointer(
  kind: MarkdownBodyKind,
  postId: number,
  locale: MarkdownBodyLocale,
  path: string
): string {
  const prefix = pointerPrefix(kind, postId, locale);
  if (!path.startsWith(prefix)) {
    throw new Error(`[ws-body] pointer '${path}' does not belong to ${prefix}`);
  }
  const file = path.slice(prefix.length);
  if (!/^[0-9a-f]{64}\.md$/.test(file)) {
    throw new Error(
      `[ws-body] pointer '${path}' is not a canonical ${prefix}<sha256>.md key`
    );
  }
  return file.slice(0, -'.md'.length);
}

/**
 * Resolves the EN/IT Markdown of one post from Storage. Throws on any integrity
 * failure; a locale without a committed pointer resolves to an empty body.
 */
export async function readMarkdownBodies(
  args: ReadMarkdownBodiesArgs
): Promise<ResolvedMarkdownBodies> {
  const { kind, postId, storage } = args;
  const resolved: ResolvedMarkdownBodies = { en: '', it: '' };

  for (const locale of BODY_LOCALES) {
    const path = args.pointers[locale] ?? null;
    if (path === null) {
      // No committed body for this locale: the row has no object, and there is
      // no PostgreSQL copy that could stand in for it.
      continue;
    }

    const expectedHash = expectedHashFromPointer(kind, postId, locale, path);
    const result = await storage.download(path);
    if (result.error) {
      throw new Error(
        `[ws-body] download ${path} failed: ${messageOf(result.error)}`
      );
    }
    if (result.data == null) {
      throw new Error(`[ws-body] download ${path} returned no data`);
    }

    const bytes = await payloadToBytes(result.data);
    const actualHash = sha256Hex(bytes);
    if (actualHash !== expectedHash) {
      throw new Error(
        `[ws-body] integrity failure at ${path}: content hash ${actualHash} does not match the object key`
      );
    }

    resolved[locale] = bytes.toString('utf8');
  }

  return resolved;
}

/**
 * A detail row with any internal pointer columns removed. Object keys are an
 * implementation detail and never travel to the page or the client payload.
 */
export function withoutBodyPointers<
  TRow extends { body_en_path?: unknown; body_it_path?: unknown },
>(row: TRow): Omit<TRow, 'body_en_path' | 'body_it_path'> {
  const copy = { ...row } as Record<string, unknown>;
  delete copy.body_en_path;
  delete copy.body_it_path;
  return copy as Omit<TRow, 'body_en_path' | 'body_it_path'>;
}
