/**
 * Content-revalidation contract (public website side).
 *
 * The standalone CMS sends signed content-change events to
 * `POST /api/internal/content-revalidate`. This module owns:
 * - event schema validation;
 * - the allowed tag namespace;
 * - HMAC-SHA256 signing/verification;
 * - timestamp freshness (replay window).
 *
 * Tags are the ONLY thing the website acts on: the CMS can never request
 * arbitrary `revalidatePath` values, only allowed tags from the public cache
 * vocabulary (src/libs/content/cacheTags.ts).
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

export const REVALIDATION_VERSION = 1 as const;
export const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
export const MAX_EVENT_TAGS = 50;
export const MAX_EVENT_BODY_BYTES = 16 * 1024;
export const SIGNATURE_PREFIX = 'v1=';

const ALLOWED_SOURCES = ['okazakee-cms'] as const;
const ALLOWED_OPERATIONS = [
  'create',
  'update',
  'delete',
  'publish',
  'unpublish',
  'asset-update',
] as const;
const ALLOWED_ENTITIES = [
  'blog',
  'portfolio',
  'career',
  'skills',
  'contacts',
  'hero',
  'resume',
  'translations',
  'privacy',
  'author',
] as const;

// Hard-coded allowed tag namespace. Never accept arbitrary tags from the CMS.
const ALLOWED_TAG_PATTERN =
  /^(translations|privacy-policy|hero|skills|career|contacts|blog|portfolio|posts|resume|hero_section|post:(blog|portfolio):[A-Za-z0-9_-]+|author:[A-Za-z0-9_-]+)$/;

const EVENT_ID_PATTERN = /^[A-Za-z0-9-]{8,100}$/;
const MAX_ENTITY_ID_LENGTH = 100;

export type RevalidationEvent = {
  version: typeof REVALIDATION_VERSION;
  eventId: string;
  occurredAt: string;
  source: (typeof ALLOWED_SOURCES)[number];
  operation: (typeof ALLOWED_OPERATIONS)[number];
  entity: (typeof ALLOWED_ENTITIES)[number];
  entityId?: number | string;
  tags: string[];
};

export type ValidationResult =
  | { ok: true; event: RevalidationEvent }
  | { ok: false; error: string };

export function validateRevalidationEvent(raw: unknown): ValidationResult {
  if (typeof raw !== 'object' || raw === null) {
    return { ok: false, error: 'Event must be a JSON object' };
  }
  const event = raw as Record<string, unknown>;

  if (event.version !== REVALIDATION_VERSION) {
    return { ok: false, error: `Unsupported version: ${String(event.version)}` };
  }

  if (
    typeof event.eventId !== 'string' ||
    !EVENT_ID_PATTERN.test(event.eventId)
  ) {
    return { ok: false, error: 'eventId must be a string of 8-100 chars' };
  }

  if (typeof event.occurredAt !== 'string' || Number.isNaN(Date.parse(event.occurredAt))) {
    return { ok: false, error: 'occurredAt must be an ISO timestamp' };
  }

  if (!ALLOWED_SOURCES.includes(event.source as never)) {
    return { ok: false, error: 'Unknown source' };
  }

  if (!ALLOWED_OPERATIONS.includes(event.operation as never)) {
    return { ok: false, error: 'Unknown operation' };
  }

  if (!ALLOWED_ENTITIES.includes(event.entity as never)) {
    return { ok: false, error: 'Unknown entity' };
  }

  if (event.entityId !== undefined) {
    const idType = typeof event.entityId;
    const idValue = event.entityId as unknown;
    const idOk =
      idType === 'number' ||
      (idType === 'string' && (idValue as string).length <= MAX_ENTITY_ID_LENGTH);
    if (!idOk) {
      return { ok: false, error: 'entityId must be a number or short string' };
    }
  }

  if (!Array.isArray(event.tags) || event.tags.length === 0) {
    return { ok: false, error: 'tags must be a non-empty array' };
  }
  if (event.tags.length > MAX_EVENT_TAGS) {
    return { ok: false, error: `Too many tags (max ${MAX_EVENT_TAGS})` };
  }
  const seen = new Set<string>();
  for (const tag of event.tags) {
    if (typeof tag !== 'string' || !ALLOWED_TAG_PATTERN.test(tag)) {
      return { ok: false, error: `Tag not allowed: ${String(tag)}` };
    }
    seen.add(tag);
  }

  return {
    ok: true,
    event: {
      version: REVALIDATION_VERSION,
      eventId: event.eventId,
      occurredAt: event.occurredAt,
      source: event.source as RevalidationEvent['source'],
      operation: event.operation as RevalidationEvent['operation'],
      entity: event.entity as RevalidationEvent['entity'],
      entityId: event.entityId as number | string | undefined,
      tags: [...seen],
    },
  };
}

/**
 * HMAC-SHA256 over `timestamp + "." + rawRequestBody`, prefixed `v1=`.
 */
export function signRevalidationEvent(
  secret: string,
  timestamp: string,
  rawBody: string
): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(`${timestamp}.${rawBody}`);
  return `${SIGNATURE_PREFIX}${hmac.digest('hex')}`;
}

/**
 * Constant-time signature verification. Rejects anything without the v1=
 * prefix or with a length mismatch.
 */
export function verifyRevalidationSignature(
  secret: string,
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  if (!signature.startsWith(SIGNATURE_PREFIX)) return false;
  const expected = signRevalidationEvent(secret, timestamp, rawBody);
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function isTimestampFresh(
  timestamp: string,
  now: number = Date.now()
): boolean {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return false;
  return Math.abs(now - parsed) <= REPLAY_WINDOW_MS;
}
