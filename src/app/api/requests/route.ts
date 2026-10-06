import { NextResponse } from 'next/server';
import { publicConfig } from '@/config/public';
import { MAX_REQUEST_BODY_BYTES } from '@/config/requests';
import { clientKeyFromHeaders } from '@/libs/clientKey';
import {
  type RequestIntakeErrorCode,
  type RequestIntakeField,
  validateRequestIntake,
} from '@/libs/requests/intake';
import { requestThrottle } from '@/libs/requests/rateLimit';
import { storeRequest } from '@/libs/requests/store';

/**
 * Public project-request intake.
 *
 * POST only, JSON only, with every field re-validated server-side before it
 * is written through the service-role client. The request reaches Postgres
 * only after (a) the body is under the hard cap, (b) the per-IP budget
 * allows it, and (c) validation passes — in that order, cheapest first.
 *
 * Responses are stable codes plus the offending field, never prose: the body
 * is rendered by the visitor's own locale on the form.
 *
 * When `REQUEST_INTAKE_ENABLED` is off (the fail-safe default on production
 * builds) the endpoint answers 503 instead of collecting requests the owner
 * is not ready to read, and the form shows its "coming soon" band. The two
 * are driven by the same flag, so the visitor's view and the endpoint's
 * behaviour can never disagree.
 */

const FIELD_STATUS: Record<RequestIntakeField, number> = {
  locale: 400,
  name: 400,
  email: 400,
  company: 400,
  website: 400,
  type: 400,
  budget: 400,
  timeline: 400,
  request: 400,
  consent: 422,
};

function fail(
  status: number,
  code: RequestIntakeErrorCode,
  field: RequestIntakeField
) {
  return NextResponse.json({ code, field }, { status });
}

export async function POST(request: Request) {
  if (!publicConfig.requestIntakeEnabled) {
    return fail(503, 'intakeDisabled', 'locale');
  }

  const declaredLength = Number.parseInt(
    request.headers.get('content-length') ?? '',
    10
  );
  if (
    Number.isFinite(declaredLength) &&
    declaredLength > MAX_REQUEST_BODY_BYTES
  ) {
    return fail(413, 'bodyTooLarge', 'request');
  }

  if (!requestThrottle.allow(clientKeyFromHeaders(request.headers))) {
    return fail(429, 'tooManyRequests', 'locale');
  }

  const raw = await request.text();
  if (raw.length > MAX_REQUEST_BODY_BYTES) {
    return fail(413, 'bodyTooLarge', 'request');
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return fail(400, 'invalidBody', 'locale');
  }

  const validation = validateRequestIntake(decoded);
  if (!validation.ok) {
    return fail(
      FIELD_STATUS[validation.field],
      validation.code,
      validation.field
    );
  }

  const stored = await storeRequest(validation.payload);
  if (!stored.ok) {
    // 503: the row is NOT stored, so the visitor is told to retry rather than
    // shown a confirmation for a message that was lost.
    return fail(503, 'storageUnavailable', 'request');
  }

  return NextResponse.json({ ok: true, id: stored.id }, { status: 201 });
}
