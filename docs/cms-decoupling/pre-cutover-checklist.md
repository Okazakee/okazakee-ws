# CMS Decoupling — Production Cutover Checklist

> **Status: COMPLETED (2026-08-17).** The env names below reflect the
> pre-cutover state. Since cutover the public site and the CMS migrated to
> the publishable/secret Supabase key split:
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
> - `SUPABASE_SERVICE_ROLE_KEY` → `SUPABASE_SECRET_KEY`
> Login rate limiting now uses the hardened, split-bucket migrations in
> `Okazakee/okazakee-cms/supabase/migrations/` (see that repo's README).
> This checklist is kept as the historical record of the cutover.

Standalone CMS: `Okazakee/okazakee-cms` (private, `main`)
Public site: `Okazakee/okazakee-ws` (`beta`/`master`)
Extraction source commit: `234b064` (public repo beta)

This phase REQUIRES user action: deployment, secrets and Supabase
configuration cannot be changed from the migration workspace. Work through
this list in order; every item is reversible.

## 0. Preconditions (all verified in this workspace)

- [x] Public repo: lint / tsc / 72 tests / build green
- [x] CMS repo: lint / tsc / 60 tests / build green
- [x] Cross-app revalidation contract proven (signed event → 200)
- [x] CMS shell renders; auth redirects work
- [x] Browser E2E prerequisites: GitHub OAuth allowlist entries added for
      okazakee-cms.vercel.app + localhost:3001 (dashboard)

## 1. Supabase

1. Apply `supabase/migrations/20260817100000_cms_login_rate_limit.sql`
   (SQL editor or `supabase db push`) — creates `cms_login_attempts` +
   `cms_check_login_rate` + `cms_purge_login_attempts`. Additive/reversible.
2. Update Auth → URL Configuration → Redirect URLs:
   (the CMS serves root paths since the route move; old `/cms/` entries can
   be removed)
   - `https://cms.okazakee.dev/en/auth/callback`
   - `https://cms.okazakee.dev/it/auth/callback`
   - local: `http://localhost:3001/en/auth/callback` (dev)
   - recovery destinations under the CMS origin.
3. (Post-cutover, separate task) create a dedicated Supabase secret key
   `SUPABASE_SECRET_KEY=sb_secret_...` for the CMS; then remove
   `SUPABASE_SERVICE_ROLE_KEY` from the public site env.

## 2. Standalone CMS deployment (Vercel)

Env (server + public where noted):

```env
APP_ENV=production
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # replaced by SUPABASE_SECRET_KEY post-cutover
CMS_PUBLIC_URL=https://cms.okazakee.dev
CMS_AUTH_DEBUG=false
WEBSITE_REVALIDATION_URL=https://okazakee.dev/api/internal/content-revalidate
WEBSITE_REVALIDATION_SECRET=<shared with public site>
NEXT_PUBLIC_SITE_URL=https://cms.okazakee.dev   # only if client code needs it
NEXT_PUBLIC_LOCALES=en,it
NEXT_PUBLIC_DEFAULT_LOCALE=en
ISR_REVALIDATION=86400
CONTENT_ENFORCE_PUBLISH_DATE=true
```

Build: `bun run build`; Framework Preset Next.js.

## 3. Public site

1. Deploy the current `beta`/`master` (contains signed revalidation endpoint).
2. Add env:
   ```env
   CONTENT_REVALIDATION_SECRET=<same secret as WEBSITE_REVALIDATION_SECRET>
   APP_ENV=production
   CONTENT_ENFORCE_PUBLISH_DATE=true
   ISR_REVALIDATION=86400
   ```
3. Smoke: admin edits content in the CMS → public page reflects change after
   revalidation (`revalidateTag(tag, 'max')` = stale-while-revalidate; first
   visitor after publish may see stale content — accepted semantics, see plan
   §3.4).

## 4. Cutover steps

1. Deploy standalone CMS; keep old CMS untouched.
2. Verify CMS admin + editor logins (email + GitHub) against production data.
3. Run the behavior-matrix parity spot-checks (blog/portfolio CRUD, uploads,
   hero/skills/career/contacts, privacy edit now reaching the public page,
   resume uploads, user management, author name/avatar change → public post).
4. DONE: old CMS URLs redirected via public Proxy (`LEGACY_CMS_REDIRECT_HOST`
   env) — `/en/cms*` and `/it/cms*` → `https://cms.okazakee.dev/...`,
   307, query strings preserved. Rollback: unset the env + redeploy.
5. Watch logs (auth errors, storage failures, `[content-revalidate]`
   rejections, `[revalidation]` failures).

## 5. Post-cutover cleanup (Phase 13 + 14)

1. Remove CMS routes/actions/components/hooks/state/messages from public repo.
2. Simplify public Proxy + layout (delete ConditionalHeader/Footer).
3. Remove elevated Supabase key from the public deployment.
4. Apply durable rate limiter activation: switch login.ts to
   `checkLoginRateLimitDurable` (migration from step 1 must be applied).
5. Optional key migration to publishable/secret API keys.

## Rollback

- Before CMS code removal: stop using standalone CMS, keep using the
  integrated one — no data migration (same Supabase project).
- After redirects: remove the redirect, redeploy the pre-cutover public
  commit (tag it `pre-cms-extraction-final` before Phase 13).
- Data always stays in the same Supabase project; no reverse DB migration.

## Exact extraction provenance

- Public source commit: `234b064` (`refactor: centralize public cache
  invalidation vocabulary`) — CMS repo import commit `e60e7b4` is a tree
  export of that commit.
- CMS repo commit history: import e60e7b4 → shell 56bb48b → auth 4a9c79f →
  cmsStore 454d398 → data/uploads fef19dd → revalidation client 4dbdec8.
