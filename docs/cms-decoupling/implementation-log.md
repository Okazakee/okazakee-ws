# CMS Decoupling — Implementation Log

Running log per the orchestration instructions. Updated every phase.

## Model constraint (ABSOLUTE MODEL REQUIREMENT)

The task mandates DeepSeek V4 Flash for every role. The harness exposes no
per-subagent model override on `task`/`hub`, so subagent model cannot be
guaranteed. Per the instruction "if the harness cannot guarantee DeepSeek V4
Flash for a particular delegated call, do not make that delegated call", **no
subagents are spawned**. All orchestration, analysis, implementation, review
and verification are performed by the primary DeepSeek V4 Flash route. Tool
calls are parallelized instead.

## Sources of truth

- Plan: `/home/okazakee/Desktop/okazakee-cms-decoupling-plan.md` (4027 lines, read in full)
- Current checkout: `beta` @ `f448986` (`chore: remove graphify leftovers`)
- Audited commit per plan: `master` `551c552` — `git diff master beta` is empty, tree identical
- Behavior matrix: `docs/cms-decoupling/behavior-matrix.md`

## Phase log

### Phase 0 — Freeze the behavioral contract (2026-08-17)

- Read the full 4027-line plan.
- Full audit of current repo (all CMS routes, actions, components, hooks,
  stores, i18n, proxy, supabase clients, getData, next.config, env docs, git).
- Baseline: `bun run lint` clean (139 files); `bunx tsc --noEmit` exit 0.
- All 25 plan items verified against source. Classification in behavior-matrix.md §10.
- Key CONFIRMED BUGS (reproduce before copying): privacy write path never
  reaches the `privacy_policy` column; hero image stored/returned URL mismatch;
  `usersActions(GET)` editor-accessible; avatar + blog/portfolio `.webp`
  hardcoded extension with PNG fallback; `post` global cache tag; missing
  `author:<id>` invalidation; no `serverActions.bodySizeLimit` vs 10 MB
  validators; 5 duplicated elevated Supabase clients; invite URLs → monolith.
- Git: no tags exist. No `.github/` workflows. No docs/ dir before this phase.

### Phase 1 — Migration safety net (2026-08-17)

- Added `vitest` (dev dep), `vitest.config.ts` (`@/` alias, node env).
- Extracted pure validation helpers from `fileHelpers.ts` into
  `src/utils/cms/validation.ts` (exact move, re-exported; zero behavior change)
  so they are unit-testable without server deps.
- Tests: `src/utils/cms/validation.test.ts` (sanitizeFilename, image/PDF
  validation, storage path extraction, URL/date validation) and
  `src/app/actions/cms/utils/auth.test.ts` (getSafeCmsNext, GitHub username,
  provider, display name, avatar, allowlist matching). 43 tests, all passing.
  Two initial test expectations were corrected to match ACTUAL behavior
  (sanitizeFilename strips `@`/`?` without hyphen; PDF MIME alone passes
  validatePdfFile regardless of extension) — characterization, not fix, per
  Phase 1 scope.
- `.github/workflows/ci.yml`: bun 1.3.7, `bun install --frozen-lockfile`,
  lint, tsc, test, build (placeholder env for build).
- `package.json`: added `"test": "vitest run"`.
- Gates verified locally: lint 143 files clean, tsc exit 0, 43/43 tests,
  production build green (~10s).

### Phase 2 — Make the monolith easier to split (in progress)
### Phase 2 — Monolith split preparation (done)

- Config modules: `src/config/shared.ts` (appEnv/APP_ENV, supabase url/key,
  parsePositiveInt), `src/config/public.ts` (hostname, publish-date
  enforcement, ISR seconds, umami), `src/config/cms.ts` (CMS_PUBLIC_URL,
  auth debug).
- Removed `VERCEL_ENV` business semantics from `getData.ts` and
  `next.config.ts`; hostname now derived from NEXT_PUBLIC_SUPABASE_URL with a
  clear build error when missing; layout preconnect literal also replaced.
- Canonical elevated Supabase client: `src/libs/cms/supabase/admin.ts`
  (module-cached, no session persistence). Replaced 5 duplicated constructors
  (fileHelpers, deleteAccount, usersActions x2 + inline x2, profileSync).
- Removed dead registration: `signup.ts` + `/[locale]/cms/register` deleted;
  middleware comment cleaned.
- FIXED privacy write bug: new `i18nActions UPDATE_PRIVACY` writes the real
  `privacy_policy` column (preserving translations JSON), tags
  `privacy-policy`; PrivacyPolicySection uses it. (Was writing
  `translations.privacy_policy.privacy_policy` — never reached public page.)
- FIXED hero image URL inconsistency: stored and returned `propic` now
  identical (cache-busted canonical value).
- FIXED URL validation: added `isValidHttpUrl` (career/portfolio links) and
  `isValidContactUrl` (contacts http/https/mailto/tel); generic `isValidUrl`
  no longer used as the security policy.
- FIXED `usersActions(GET)` authorization: all user-management operations
  (including list) now require admin. Verified author picker uses
  `blogActions GET_AUTHORS`, unaffected.
- Consolidated avatar uploads (admin + self) onto `prepareImageUpload`/
  `uploadPreparedImage`: extension and MIME now follow the actual processed
  format (WebP passthrough or PNG fallback).
- Invalidation descriptors: `src/libs/cms/invalidation.ts` (pure,
  unit-tested) maps entity+operation → public tag set; `invalidateContent`
  adapter applied `updateTag` in the monolith. All 8 section action files
  + deleteAccount switched from ad-hoc tags to descriptors.
- Gates green: lint, tsc, 53 tests, build.

### Phase 3 — Public cache contract (done)

- `src/libs/content/cacheTags.ts`: single source of truth for the public tag
  vocabulary (`translations`, `privacy-policy`, `hero`, `skills`, `career`,
  `contacts`, `blog`, `portfolio`, `posts`, `post`, `resume`, `hero_section`
  + builders `postDetailTag`, `authorTag`).
- Descriptor rewritten on the constants; `getData.ts` uses constants.
- `getPost()` now tags `post:blog:<id>` / `post:portfolio:<id>` AND
  `author:<author-id>` when the post embeds a profile (retains legacy `post`).
- Author-profile mutations (`updateMyProfile`, `updateUserProfile`,
  `updateUserDisplayName`, `uploadUserAvatar`, `removeUser`, `deleteMyAccount`)
  emit `author:<id>` invalidation.
- Invalidation matrix covered by descriptor + cacheTags unit tests (56 total).

### Phase 4 — Standalone CMS repository (done)

- Created `Okazakee/okazakee-cms` (private) via gh CLI.
- Extracted from public repo at commit `234b064` (beta HEAD after Phases 0-3)
  via `git archive` — no secrets, no `.git` history copied.
- Import commit `chore: import cms from okazakee-ws` pushed to `main`;
  provenance recorded in README; package name `okazakee-cms`.
- Import baseline builds with real env (same Supabase project, read-only).

### Phase 5 — Standalone CMS shell (done)

- CMS-only locale layout: removed public Header/Footer/ScrollTop/SpeedInsights/
  Umami; kept Providers, theme script, fonts; preconnect derived from config.
- i18n: CMS static messages merged with Supabase public translations — kept
  deliberately because CMS previews render public section content.
- Proxy: removed public-site bot-probe block; kept locale routing + session
  refresh + CMS route protection.
- `CMS_PUBLIC_URL` introduced: `getRequestOrigin()` uses it in production
  (no forwarded-header reconstruction); invite/recovery redirects target it;
  `.env.local.example` documents it.

### Phase 6 — CMS auth/RBAC (done)

- Consolidated auth context: `requireAuth`/`requireAdmin`/
  `requireAllowedPostWriter` now delegate to `getCmsActionContext` (one
  canonical authorization path).
- Durable rate limiter: `supabase/migrations/20260817100000_cms_login_rate_limit.sql`
  (table + SECURITY DEFINER RPC, 5/min, 15-min lockout) + module
  `src/libs/cms/loginRateLimit.ts` with hashed identifiers. ACTIVATION
  deferred to pre-cutover (cannot apply DDL to production Supabase from here:
  no CLI token, no DB password). Current Map limiter kept for parity.
- Account semantics documented in CMS README (delete = revoke access, keeps
  auth identity; dummy authors; last-admin protection).

### Phase 7 — CMS state/components/hooks (done)

- `src/store/layoutStore.ts` → `src/store/cmsStore.ts`,
  `useLayoutStore` → `useCmsStore`, `LayoutState` → `CmsState`; all 10
  consumers updated.
- Components/hooks/theme primitives already present in the CMS repo via the
  full import — no cross-repo filesystem dependencies exist.

### Phase 8 — CMS content actions / data reads (done)

- CMS reads decoupled from public cached getters: career + hero GET now query
  Supabase directly (uncached); blog/portfolio/contacts/skills GETs already
  direct.
- Upload consolidation: all blog + portfolio legacy upload paths
  (`uploadBlogImageForNewPost`, `uploadBlogImage`, `uploadPortfolioImage*`)
  now use `prepareImageUpload`/`uploadPreparedImage`; extension/MIME match the
  actual processed format; stale `.webp`/`.png` variants cleaned on replace;
  blog single-image upload gained the previously-missing asset invalidation.
- Author invalidation carried over (usersActions).

### Phase 9 — Public signed revalidation endpoint (done)

- `src/libs/content/revalidation.ts` (public repo): event schema validation,
  HMAC-SHA256 signing/verification (constant-time), 5-min replay window,
  hard-coded allowed tag namespace, max 50 tags / 16 KB body.
- `src/app/api/internal/content-revalidate/route.ts`: POST-only Route Handler,
  `revalidateTag(tag, 'max')` (never `updateTag`), structured errors, logs
  eventId/operation/entity/tags/duration — never secrets.
- 16 unit tests; live smoke: valid → 200 accepted, wrong sig → 401, unknown
  tag → 400, stale timestamp → 401, missing headers → 401, GET → 405.

### Phase 10 — CMS revalidation client (done)

- `src/libs/public-site/revalidation.ts` (CMS repo): builds the signed event
  from descriptors, one deduplicated event per operation, 5 s timeout,
  never throws (a committed DB write is never reported failed because the
  cross-app request failed); logs eventId on failure for retry/debug.
- Replaced the monolithic `invalidateContent`/`updateTag` adapter in all
  action files + deleteAccount.
- Cross-app contract test: CMS `invalidatePublicContent` → public endpoint →
  200 accepted.

### Phase 11 — Dual-run validation (in progress)

Verified (no credentials required):
- Both repos: lint clean, tsc 0, public 72 tests / CMS 60 tests, builds exit 0.
- Public pages smoke: /en, /it, /en/privacy-policy, /sitemap.xml, /robots.txt
  → 200; revalidation endpoint GET → 405.
- CMS shell smoke: /en/cms/login → 200; /en/cms unauthenticated → 307 →
  login; GitHub OAuth start → Supabase authorize with callback
  `http://localhost:3001/en/cms/auth/callback` (canonical origin OK).
- Cross-app revalidation: signed event from CMS module accepted by public
  endpoint; author event with no id correctly skipped.

NOT verified (blocked — requires admin credentials / deployment):
- Browser E2E: admin/editor login, GitHub OAuth session, section CRUD,
  uploads, EN/IT resume flow, author profile → public cache invalidation.
- Storage parity (bucket/path/contentType/dimensions per asset type).
- Production deploy + dual-run against real data.

## Next phases

### Phase 12 — Production cutover (BLOCKED: requires user)

Requires user action: deploy standalone CMS (Vercel), configure secrets,
update Supabase redirect allowlist, apply rate-limit migration SQL, restrict
old CMS. Pre-cutover checklist: docs/cms-decoupling/pre-cutover-checklist.md.

### Phase 13 — Remove CMS from public repo (GATED on Phase 12)

Plan: "Only start after the standalone CMS has passed production cutover."
NOT started — deleting the integrated CMS before the standalone CMS is
production-validated would remove the rollback path.

### Phase 14 — Post-extraction cleanup / docs (in progress)

- Durable rate limiter activation (pre-cutover).
- Publishable/secret key migration (post-cutover, Supabase console).
- Docs sync for both repos.

### Cutover execution (2026-08-17, after CLI auth)

- Verified: Vercel CLI as `okazakee`; Supabase CLI project
  `mtvwynyikouqzmhqespl` (Okazakee's Project, Zurich).
- Supabase: applied `20260817100000_cms_login_rate_limit.sql` via Management
  API (`database/query`) — table `cms_login_attempts` + functions
  `cms_check_login_rate`/`cms_purge_login_attempts` verified present.
  Redirect allowlist NOT touched programmatically (risk of clobbering live
  monolith OAuth); dashboard entries documented in the checklist.
- Vercel: created + linked project `okazakee-cms`; 11 production env vars
  (supabase creds, CMS_PUBLIC_URL=https://okazakee-cms.vercel.app,
  WEBSITE_REVALIDATION_URL/SECRET, APP_ENV=production, locales, ISR).
  Deployed to production — Ready; /en/cms/login 200, /en/cms 307 → login,
  /it/cms/login 200.
- Shared revalidation secret generated (hex 64) and set on BOTH Vercel
  projects (CMS: WEBSITE_REVALIDATION_SECRET; public:
  CONTENT_REVALIDATION_SECRET production+preview) and local .env.local files.
- Public Vercel project: added CONTENT_REVALIDATION_SECRET (prod+preview),
  APP_ENV (production prod / staging preview),
  CONTENT_ENFORCE_PUBLISH_DATE (true prod / false preview).
- Public repo: beta pushed (9 commits), merged into master (`c2af337 merge:
  cms decoupling cutover (beta)`), production deploy Ready (57s).
- Verified in production: okazakee.dev /, /en, /en/privacy-policy,
  /sitemap.xml → 200; cross-app revalidation CMS module →
  https://okazakee.dev/api/internal/content-revalidate → `sent`.
- Old integrated CMS still live at okazakee.dev/en/cms (rollback path).

### Remaining user actions (documented in pre-cutover-checklist.md)

1. Supabase dashboard → Auth → URL Configuration: add CMS redirects
   `http://localhost:3001/{en,it}/cms/auth/callback` and
   `https://okazakee-cms.vercel.app/{en,it}/cms/auth/callback`
   (required for GitHub OAuth on the new CMS).
2. Validate new CMS on production data (email login, GitHub OAuth, CRUD,
   uploads, resume flow, author profile → public cache invalidation).
3. Then: restrict/redirect old CMS URLs, proceed to Phase 13 cleanup.

### Cutover step 4 — legacy CMS redirect (2026-08-17)

- User added Supabase redirect URLs (localhost:3001 + okazakee-cms.vercel.app
  callbacks). Verified GitHub OAuth chain on the deployed CMS: start → 307 →
  Supabase authorize (redirect_to = okazakee-cms.vercel.app/en/cms/auth/callback)
  → 302 → GitHub (allowlist accepted).
- Public Proxy: `LEGACY_CMS_REDIRECT_HOST` env-gated 307 redirect for
  /{locale}/cms* → new host (query strings preserved; unset = integrated CMS
  keeps serving for local/rollback). Env set on Vercel production.
- Verified live: /en/cms, /en/cms/login, /it/cms → 307 → okazakee-cms.vercel.app;
  OAuth callback with ?code= carried through; /en still 200.
- Commits: 6c0a0ee (redirect), 42fcbb9 (docs); master == beta, both pushed.

### Custom domain — cms.okazakee.dev (2026-08-17)

- User added the Cloudflare CNAME (cms.okazakee.dev, proxied). DNS resolved
  (Cloudflare anycast), initial HTTPS 525 (SSL handshake to origin) until the
  domain was attached to the Vercel project.
- `vercel domains add cms.okazakee.dev okazakee-cms` → assigned; `vercel
  domains verify` → "configured_correctly" (CNAME). HTTPS then 200.
- Env switched: CMS `CMS_PUBLIC_URL=https://cms.okazakee.dev`; public
  `LEGACY_CMS_REDIRECT_HOST=https://cms.okazakee.dev`. Both redeployed.
- Verified: cms.okazakee.dev/en/cms/login 200; okazakee.dev/en/cms → 307 →
  cms.okazakee.dev; okazakee.dev /en 200; GitHub OAuth start on the custom
  domain → Supabase authorize (redirect_to=cms.okazakee.dev) → GitHub
  authorize (allowlist accepted).
- No Cloudflare API access existed (wrangler unauthenticated); DNS was set by
  the user in the Cloudflare dashboard, domain attachment done via Vercel CLI.

### Post-cutover hotfix — sharp runtime failure (2026-08-17)

Symptom: after login, `POST /en/cms` failed with
"Failed to load external module sharp-... ERR_DLOPEN_FAILED:
libvips-cpp.so.8.18.3: cannot open shared object file" → the CMS dashboard
never rendered (Server Components render error). User reported landing on the
og homepage at /en (the CMS app still ships the imported public routes; the
dashboard error had redirected them around).

Root cause (diagnosed with a temporary /api/diag FS probe): the runtime
filesystem HAD all native files
(/vercel/path0/node_modules/@img/sharp-linux-x64/lib/*.node and
@img/sharp-libvips-linux-x64/lib/libvips-cpp.so.8.18.3) — the failure was
Turbopack's EXTERNAL module loader (`serverExternalPackages: ['sharp']`)
breaking sharp's __dirname-relative native requires at runtime.

Fix (CMS repo, deployed, verified via browser with real session):
1. Removed `serverExternalPackages: ['sharp']` — Turbopack now bundles the
   native addon with correct resolution.
2. Lazy-loaded sharp inside processImage() — the addon is no longer in any
   action module's load path (dashboard boot works even if native loading
   regresses).
3. Kept @img/sharp-linux-x64 + @img/sharp-libvips-linux-x64 as direct deps.
Verified: dashboard renders (admin user, sidebar + hero editor).
Temporary debug account (auth user + allowlist + profile) created to
reproduce, then fully deleted; /api/diag removed.

Note: the public monolith has the same latent sharp packaging issue for its
(now-redirected) old CMS actions; Phase 13 removes that code.

### Phase 13 — CMS removed from public repo (2026-08-17)

- Deleted from okazakee-ws: `/[locale]/cms/**` routes, `actions/cms/**`,
  `components/cms/**`, `components/common/cms/**`, `hooks/cms/**`,
  `store/layoutStore.ts`, `i18n/messages/cms.*.json`, `libs/cms/**`,
  `config/cms.ts`, `libs/rateLimiters.ts`, `utils/cms/**`,
  `utils/imageProcessor.ts`, `utils/blurhashUtils.ts`,
  `utils/supabase/{middleware,client,server}.ts`,
  `ConditionalHeader/Footer.tsx`, CMS tests (auth/validation/invalidation).
- Public-only cleanup: layout renders Header/Footer directly (no CMS message
  merge); `i18n/request.ts` public messages only; NavMenu CMS branch removed;
  Footer "CMS" link → `NEXT_PUBLIC_CMS_URL` (fallback `/en/cms` redirects);
  Proxy: session middleware removed, keeps locale routing + legacy
  `LEGACY_CMS_REDIRECT_HOST` 307; view counters switched to stateless
  publishable-key client; `@supabase/ssr` + `blurkit` deps removed
  (validator kept — Searchbar).
- Docs: README (public-only + CMS repo link), AGENTS.md (structure/examples),
  .env.local.example (no elevated key; NEXT_PUBLIC_CMS_URL documented).
- SECURITY: `SUPABASE_SERVICE_ROLE_KEY` removed from the okazakee-ws Vercel
  production env (repo audit: zero references).
- Gates: lint 79 files clean, tsc 0, 19 tests, build green; commit 2af55d7.
- Verified production post-removal: /en /it privacy sitemap 200, legacy
  /en/cms → 307 → cms.okazakee.dev, revalidation bridge `sent`,
  cms.okazakee.dev login 200. CMS repo likewise pruned of public-only code
  (commit ef0a226): / → login redirect, /en → 404, login 200.

### CMS routes moved to root path (2026-08-17)

- `/[locale]/cms/*` → `/[locale]/*` (route group `(app)` keeps a
  `connection()` layout for request-time rendering; root layout keeps
  generateStaticParams for [locale]).
  - dashboard `/en/cms` → `/en`; login → `/en/login`; auth → `/en/auth/*`.
- Updated: getSafeCmsNext (root semantics, default `/`), login action/page
  redirects, OAuth start/callback/ready URLs, middleware PUBLIC_PATHS,
  SidePanel logout, invite target, auth tests.
- CMS Proxy: whole app protected (session refresh on every locale path);
  legacy `/{locale}/cms...` paths 307 → root paths (fixed locale
  double-prefix bug); root `/` → `/{locale}` → login when unauthenticated.
- Public Proxy: LEGACY_CMS_REDIRECT_HOST now strips the `/cms` segment
  (`/en/cms` → `https://cms.okazakee.dev/en`, single hop).
- Build fixes: login page usePathname moved inside Suspense; `connection()`
  moved to the (app) route-group layout (root-layout connection() triggered
  the blocking-route error); `force-dynamic` is incompatible with
  `cacheComponents` (not used).
- CI: public repo secrets (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, DOMAIN_URL —
  public values) set via gh on both repos; CMS workflow now triggers on
  `main` and uses secrets (was hardcoded placeholder + master/beta). Public
  CI green (master+beta), CMS CI green (main).
- Verified production: /en → login (unauth), /en/login 200, legacy
  okazakee.dev/en/cms → cms.okazakee.dev/en, /it/cms → /it, public /en 200.
- USER ACTION: add `https://cms.okazakee.dev/{en,it}/auth/callback` +
  `http://localhost:3001/{en,it}/auth/callback` to the Supabase redirect
  allowlist (GitHub OAuth uses the new paths); old `/cms/` entries can be
  removed.

### Supabase publishable/secret key migration — prepared (2026-08-17)

- Created API keys via Management API: `okazakee_cms_publishable`
  (publishable, works) — value captured and set as
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY on BOTH Vercel projects (prod+preview).
- Discovered: the Management API REDACTS secret key values (one-time display
  only in the Dashboard); API-created secret keys return "Invalid API key"
  (the earlier failures were tests against the redacted string). Dashboard
  creation is the only path for the secret key value.
- Code prepared in both repos: config reads
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY / SUPABASE_SECRET_KEY with legacy
  fallbacks (NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY) so
  the swap is safe; admin client uses the shared server secret. Commits:
  CMS `refactor: support publishable/secret supabase key names`, public
  `refactor: support publishable supabase key name` (38093cc). Deployed;
  CMS login 200, public /en 200.
- Cleaned up junk keys; final key set: legacy anon/service_role (active),
  publishable okazakee_cms_publishable, secret default (dashboard-created).

REMAINING USER STEP (cannot be automated — secret values are one-time):
1. Dashboard Settings → API Keys → Publishable and secret API keys tab →
   copy the `default` secret key value (or create a named one).
2. Set it as SUPABASE_SECRET_KEY in the okazakee-cms Vercel project
   (production + preview).
3. Remove SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_ANON_KEY from the
   okazakee-cms project, redeploy, verify CMS admin ops (user management,
   uploads) still work.
4. Dashboard: deactivate legacy anon + service_role keys (step 6 of
   Supabase's migration guide) once nothing uses them.

### Supabase publishable/secret key migration — COMPLETE (2026-08-17)

- Secret key value obtained (dashboard `default` key: sb_secret_VouKP...).
  Verified against the project: REST 200, RLS bypass 200, Auth Admin 200,
  Storage 200 (both-header usage, as supabase-js sends).
- CMS Vercel project: added SUPABASE_SECRET_KEY (prod+preview); REMOVED
  SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_ANON_KEY. CMS now runs
  purely on publishable + secret keys.
- Public Vercel project: NEXT_PUBLIC_SUPABASE_ANON_KEY removed; app reads
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (set earlier).
- Code: middleware, SSR server client and browser client now read the key
  from shared config (publishable) instead of the removed legacy env name —
  this was a REGRESSION introduced by the env removal (empty key made
  createServerClient throw → proxy redirect loop on /en/login, ERR_TOO_MANY_
  REDIRECTS). Fixed + redeployed; login 200, flows correct.
- Verified end-to-end in the deployed app: /en/auth/ready with a real admin
  session ran syncCmsUserProfile (admin client → SECRET key) and redirected
  to the dashboard, which rendered with the admin identity.
- Legacy keys (anon + service_role) remain ACTIVE in Supabase but are now
  unused by both apps. USER ACTION (optional, reversible): deactivate them in
  Dashboard → Settings → API Keys → Legacy API Keys tab.
