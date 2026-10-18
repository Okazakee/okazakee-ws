/**
 * Server-only Markdown reader for the public site (Phase 10A).
 *
 * Resolves a post's EN/IT Markdown from the private dev content bucket, falling
 * back to the committed PostgreSQL bodies for locales without a pointer. The
 * Storage surface is INJECTED (a bucket-scoped `storage.from(bucket)`), so
 * integrity and failure behaviour is testable without network access, and this
 * module never constructs credentials.
 *
 * Contract per locale:
 * - pointer NULL            -> the legacy PostgreSQL body;
 * - pointer + Storage       -> download, verify the raw bytes hash to the
 *                              SHA-256 embedded in the canonical key, and — while
 *                              both copies exist — verify Storage and the legacy
 *                              column agree;
 * - pointer + no Storage    -> error (a referenced object is never silently
 *                              replaced by the legacy column);
 * - missing/unreadable/bad  -> error, never an empty document.
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
  /** Bucket-scoped Storage API, or null when Storage reads are disabled. */
  storage: MarkdownStorageApi | null;
  /** Committed PostgreSQL bodies (dev projection includes both columns). */
  legacy: { en: string | null; it: string | null };
  /** Committed content-addressed pointers. */
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
 * Resolves the EN/IT Markdown of one post. Throws on any integrity failure.
 */
export async function readMarkdownBodies(
  args: ReadMarkdownBodiesArgs
): Promise<ResolvedMarkdownBodies> {
  const { kind, postId, storage } = args;
  const resolved: ResolvedMarkdownBodies = {
    en: args.legacy.en ?? '',
    it: args.legacy.it ?? '',
  };

  for (const locale of BODY_LOCALES) {
    const path = args.pointers[locale] ?? null;
    if (!path) {
      // No pointer: the committed PostgreSQL body is authoritative.
      continue;
    }

    if (!storage) {
      throw new Error(
        `[ws-body] ${path} is referenced but Storage reads are disabled`
      );
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

    const markdown = bytes.toString('utf8');
    const legacy = args.legacy[locale];
    if (legacy !== null && legacy !== markdown) {
      throw new Error(
        `[ws-body] disagreement at ${path}: stored Markdown differs from the committed PostgreSQL body`
      );
    }

    resolved[locale] = markdown;
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
