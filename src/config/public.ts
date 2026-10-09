import {
  appEnv,
  isProductionEnv,
  parsePositiveInt,
  supabasePublishableKey,
  supabaseSchema,
  supabaseUrl,
} from './shared';

const ISR_DEFAULT_SECONDS = isProductionEnv ? 60 * 60 * 24 : 60 * 10;

export const publicConfig = {
  supabaseUrl,
  supabaseSchema,
  supabasePublishableKey,

  /**
   * Supabase project hostname used for image remote patterns / preconnect.
   * Derived from the configured URL; no project-specific literal fallback.
   */
  supabaseHostname: supabaseUrl ? new URL(supabaseUrl).hostname : '',

  /**
   * Whether future-dated posts are hidden from public reads.
   * Explicit `CONTENT_ENFORCE_PUBLISH_DATE` wins; unset defaults to
   * production semantics. Set `CONTENT_ENFORCE_PUBLISH_DATE=false` on
   * staging/preview if future posts must be visible there.
   */
  contentEnforcePublishDate:
    process.env.CONTENT_ENFORCE_PUBLISH_DATE === 'true' ||
    (process.env.CONTENT_ENFORCE_PUBLISH_DATE === undefined && isProductionEnv),

  /**
   * Cache revalidation lifetime in seconds (public content + GitHub stars).
   * Defaults: production 86400, otherwise 600. Explicit ISR_REVALIDATION wins.
   */
  isrRevalidationSeconds:
    parsePositiveInt(process.env.ISR_REVALIDATION) ?? ISR_DEFAULT_SECONDS,

  /**
   * Whether the public project-request intake accepts submissions.
   *
   * Fail-safe default: OFF on production builds, ON everywhere else so
   * testers exercise the real path. A production visitor therefore sees the
   * "coming soon" band and POST /api/requests answers 503 instead of
   * silently collecting requests nobody reads. Set
   * `REQUEST_INTAKE_ENABLED=true` in the production environment to go live
   * deliberately. The route handler reads the same value, so the UI and the
   * endpoint can never disagree.
   */
  requestIntakeEnabled:
    process.env.REQUEST_INTAKE_ENABLED === 'true' ||
    (process.env.REQUEST_INTAKE_ENABLED === undefined && !isProductionEnv),

  umamiEnabled: process.env.UMAMI_ENABLED === 'true',

  appEnv,

  /**
   * True on production builds only. Use it to gate preview-only UI such as
   * the request form "coming soon" overlay: testers see the live form on
   * every other environment, prod visitors see the overlay.
   */
  isProduction: isProductionEnv,
} as const;
