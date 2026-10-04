/**
 * Server-side validation for the public project-request intake.
 *
 * This is the ONLY trust boundary: the form's `required`, `type` and
 * `pattern` attributes are UX, and anything can POST to /api/requests
 * directly, so every field is re-validated here before it reaches Postgres.
 *
 * Errors are returned as stable codes, never prose, because the endpoint is
 * anonymous and the response is rendered by the visitor's locale (EN/IT).
 */

export const REQUEST_TYPE_OPTIONS = [
  'Website',
  'Web app',
  'Mobile app',
  'Other',
] as const;

export const REQUEST_BUDGET_OPTIONS = [
  '< €1k',
  '€1–5k',
  '€5–15k',
  '€15k+',
] as const;

export const REQUEST_TIMELINE_OPTIONS = [
  'ASAP',
  '1–2 months',
  '3–6 months',
  'Flexible',
] as const;

export type RequestType = (typeof REQUEST_TYPE_OPTIONS)[number];
export type RequestBudget = (typeof REQUEST_BUDGET_OPTIONS)[number];
export type RequestTimeline = (typeof REQUEST_TIMELINE_OPTIONS)[number];
export type RequestLocale = 'en' | 'it';

/** Field length caps. The free-text body is the only generous one. */
export const REQUEST_FIELD_LIMITS = {
  name: 120,
  email: 254,
  company: 120,
  website: 300,
  request: 4000,
} as const;

export type RequestIntakeField =
  | 'locale'
  | 'name'
  | 'email'
  | 'company'
  | 'website'
  | 'type'
  | 'budget'
  | 'timeline'
  | 'request'
  | 'consent';

export type RequestIntakeErrorCode =
  | 'invalidBody'
  | 'invalidField'
  | 'missingConsent'
  | 'tooManyRequests'
  | 'intakeDisabled'
  | 'bodyTooLarge'
  | 'storageUnavailable';

export type RequestIntakePayload = {
  locale: RequestLocale;
  name: string;
  email: string;
  company: string;
  website: string;
  type: RequestType;
  budget: RequestBudget;
  timeline: RequestTimeline;
  request: string;
  consent: true;
};

export type RequestIntakeValidation =
  | { ok: true; payload: RequestIntakePayload }
  | { ok: false; field: RequestIntakeField; code: RequestIntakeErrorCode };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+(\.[^\s@]+)+$/;

const INTAKE_ERROR_CODES: readonly RequestIntakeErrorCode[] = [
  'invalidBody',
  'invalidField',
  'missingConsent',
  'tooManyRequests',
  'intakeDisabled',
  'bodyTooLarge',
  'storageUnavailable',
];

/**
 * Reads the stable failure code out of an endpoint error body so the form
 * renders the visitor's own locale instead of server prose. Returns null for
 * anything unrecognized, and the caller then shows its generic message.
 */
export function readIntakeErrorCode(
  body: unknown
): RequestIntakeErrorCode | null {
  if (typeof body !== 'object' || body === null || !('code' in body)) {
    return null;
  }
  const { code } = body;
  return typeof code === 'string' &&
    INTAKE_ERROR_CODES.includes(code as RequestIntakeErrorCode)
    ? (code as RequestIntakeErrorCode)
    : null;
}

/**
 * Reads a submitted website as an absolute http(s) URL.
 *
 * `URL` parsing plus a scheme allowlist is the whole check: it rejects
 * `javascript:`, `data:`, `file:` and relative junk, which is what the CMS
 * inbox would otherwise render as a clickable link. Returns null when the
 * value is absent (the field is optional) or unusable.
 */
function parseWebsite(
  value: unknown
): { ok: true; value: string } | { ok: false } | { ok: 'absent' } {
  if (typeof value !== 'string') return { ok: 'absent' };
  const trimmed = value.trim();
  if (trimmed === '') return { ok: 'absent' };
  if (trimmed.length > REQUEST_FIELD_LIMITS.website) return { ok: false };
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false };
  }
  if (parsed.hostname === '') return { ok: false };
  return { ok: true, value: trimmed };
}

function readText(
  body: Record<string, unknown>,
  field: keyof typeof REQUEST_FIELD_LIMITS
): string | null {
  const value = body[field];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > REQUEST_FIELD_LIMITS[field]) {
    return null;
  }
  return trimmed;
}

function readOption<T extends string>(
  body: Record<string, unknown>,
  field: string,
  options: readonly T[]
): T | null {
  const value = body[field];
  return options.includes(value as T) ? (value as T) : null;
}

function invalid(field: RequestIntakeField): RequestIntakeValidation {
  return { ok: false, field, code: 'invalidField' };
}

/**
 * Validates a decoded request body into the exact row shape
 * `project_requests` stores.
 *
 * `consent` is required: the visitor must actively accept the privacy
 * policy, so a falsey value is its own error rather than a generic field
 * failure the form could not point at.
 */
export function validateRequestIntake(raw: unknown): RequestIntakeValidation {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, field: 'locale', code: 'invalidBody' };
  }
  const body = raw as Record<string, unknown>;

  const locale =
    body.locale === 'it' ? 'it' : body.locale === 'en' ? 'en' : null;
  if (locale === null) return invalid('locale');

  const name = readText(body, 'name');
  if (name === null) return invalid('name');

  const email = readText(body, 'email');
  if (email === null || !EMAIL_PATTERN.test(email)) return invalid('email');

  // Optional: an individual requester has no company, and a blank value is
  // treated as absent. A submitted value that is over the cap is still
  // rejected — routing it through readText would silently store it as empty
  // and let an over-long field past the length limit.
  const company = typeof body.company === 'string' ? body.company.trim() : '';
  if (company.length > REQUEST_FIELD_LIMITS.company) return invalid('company');

  const website = parseWebsite(body.website);
  if (!website.ok) return invalid('website');

  const type = readOption(body, 'type', REQUEST_TYPE_OPTIONS);
  if (type === null) return invalid('type');

  const budget = readOption(body, 'budget', REQUEST_BUDGET_OPTIONS);
  if (budget === null) return invalid('budget');

  const timeline = readOption(body, 'timeline', REQUEST_TIMELINE_OPTIONS);
  if (timeline === null) return invalid('timeline');

  const request = readText(body, 'request');
  if (request === null) return invalid('request');

  if (body.consent !== true) {
    return { ok: false, field: 'consent', code: 'missingConsent' };
  }

  return {
    ok: true,
    payload: {
      locale,
      name,
      email,
      company,
      website: website.ok === 'absent' ? '' : website.value,
      type,
      budget,
      timeline,
      request,
      consent: true,
    },
  };
}
