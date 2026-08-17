import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import {
  MAX_EVENT_BODY_BYTES,
  isTimestampFresh,
  validateRevalidationEvent,
  verifyRevalidationSignature,
  type RevalidationEvent,
} from '@/libs/content/revalidation';

/**
 * Internal, authenticated content-revalidation endpoint.
 *
 * Called by the standalone CMS after successful content mutations. Uses
 * `revalidateTag(tag, 'max')` — a Route Handler can NEVER use `updateTag`
 * (Server-Action-only).
 *
 * Security:
 * - POST only;
 * - small fixed body limit;
 * - HMAC-SHA256 signature over timestamp + raw body;
 * - 5-minute replay window;
 * - strict event schema + hard-coded allowed tag namespace.
 */
export async function POST(request: Request) {
  const startedAt = performance.now();
  const secret = process.env.CONTENT_REVALIDATION_SECRET;

  if (!secret) {
    console.error(
      '[content-revalidate] CONTENT_REVALIDATION_SECRET is not configured'
    );
    return NextResponse.json(
      { error: 'Revalidation not configured' },
      { status: 503 }
    );
  }

  const timestamp = request.headers.get('x-content-timestamp');
  const signature = request.headers.get('x-content-signature');
  if (!timestamp || !signature) {
    return NextResponse.json(
      { error: 'Missing authentication headers' },
      { status: 401 }
    );
  }

  if (!isTimestampFresh(timestamp)) {
    return NextResponse.json(
      { error: 'Timestamp outside replay window' },
      { status: 401 }
    );
  }

  const rawBody = await request.text();
  if (rawBody.length > MAX_EVENT_BODY_BYTES) {
    return NextResponse.json({ error: 'Body too large' }, { status: 413 });
  }

  if (!verifyRevalidationSignature(secret, timestamp, rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: RevalidationEvent;
  try {
    const parsed = JSON.parse(rawBody);
    const result = validateRevalidationEvent(parsed);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    event = result.event;
  } catch {
    return NextResponse.json({ error: 'Malformed JSON' }, { status: 400 });
  }

  // The signed timestamp must describe the same event it authenticates.
  if (event.occurredAt !== timestamp) {
    return NextResponse.json(
      { error: 'Timestamp does not match event' },
      { status: 400 }
    );
  }

  for (const tag of event.tags) {
    revalidateTag(tag, 'max');
  }

  console.log('[content-revalidate]', {
    eventId: event.eventId,
    source: event.source,
    operation: event.operation,
    entity: event.entity,
    entityId: event.entityId ?? null,
    tags: event.tags,
    durationMs: Math.round(performance.now() - startedAt),
  });

  return NextResponse.json({
    accepted: true,
    eventId: event.eventId,
    tags: event.tags,
  });
}
