<p align="center">
  <img src="src/app/public/title-ws.png" alt="Okazakee" width="340" />
</p>

<p align="center">
  <strong>Personal portfolio &amp; blog</strong> — bilingual, fast by design.
  <br />
  <a href="https://okazakee.dev">okazakee.dev</a> &nbsp;·&nbsp; content managed
  by the standalone <a href="https://github.com/Okazakee/okazakee-cms">okazakee-cms</a>
</p>

---

## Overview

A Next.js 16 application that renders the public face of Okazakee: hero
section, skills grid, career timeline, portfolio projects, blog with
full-text search, and a privacy policy — all in English and Italian with
dark/light/auto theming.

This repository is deliberately **read-only for content**. It renders
published data from a shared Supabase project using Next.js Cache Components
and never edits it: all authoring happens in the standalone CMS
([Okazakee/okazakee-cms](https://github.com/Okazakee/okazakee-cms), live at
[cms.okazakee.dev](https://cms.okazakee.dev)), which invalidates
public caches through a signed revalidation endpoint
(`POST /api/internal/content-revalidate`).

## Highlights

- **Bilingual routing** — EN/IT via `next-intl`, locale-aware
  `/[locale]/[post_type]/[id]/[title]` URLs
- **Theming** — auto by default; saved light/dark choices override the system.
  Initial loads and language switches apply the theme before paint.
- **Search** — portfolio and blog content with a debounced search action
- **View tracking** — per-post counters backed by Supabase RPCs
- **Cache invalidation** — HMAC-signed, replay-protected revalidation events
  from the CMS (`cacheTag` / `cacheLife`, `revalidateTag(tag, { expire: 0 })`)
- **Performance** — Server Components for data and SEO, client islands only
  where interactivity demands it; WebP-only image pipeline (uploads arrive as
  WebP from the CMS, and the animated propic goes through the `next/image`
  optimizer, cached for 31 days)
- **Quality** — TypeScript strict mode, Biome formatting/linting, Vitest
  suites, CI on every pull request

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 · Lucide icons |
| Data | Supabase (PostgreSQL · Storage · RPCs) — read-only, publishable key |
| i18n | next-intl (EN/IT) |
| State | Zustand (theme store) |
| Quality | Biome · Vitest · GitHub Actions |
| Hosting | Vercel |

## Architecture

```text
              writes              reads
okazakee-cms ───────▶ Supabase ◀──────── okazakee-ws (this repo)
     │                                       │
     └── signed content-change event ───────▶ POST /api/internal/content-revalidate
```

- **Routing:** `/[locale]/[post_type]/[id]/[title]` with i18n; legacy
  `/{locale}/cms*` URLs 307-redirect to the standalone CMS.
- **Locale configuration:** `src/i18n/routing.ts` owns EN/IT, the English
  default and prefix policy. The proxy delegates negotiation to next-intl;
  server messages use `next/root-params` rather than request headers.
- **Language switches:** navigate directly to each post's canonical localized
  slug, retaining query parameters, fragments and a one-shot scroll handoff.
  Portfolio titles and slugs remain English in both locales.
- **Theme preferences:** `themeMode` is saved only after an explicit selection.
  Without a saved choice, auto follows live system changes. The blocking
  first-load script and locale-dependent layout effect restore the theme
  before paint without making the root layout request-bound.
- **Components:** Server Components for data and metadata; Client Components
  for interactivity (menu, theme, search).
- **Supabase:** stateless clients — the read layer plus the two view-counter
  actions — all built on the publishable key. No elevated credentials live in
  this repository.
- **Caching:** public reads use `cacheTag`/`cacheLife` with the vocabulary in
  `src/libs/content/cacheTags.ts`. The signed revalidation endpoint accepts
  content-change events from the CMS (HMAC-SHA256, replay window, hard-coded
  tag allowlist) and calls `revalidateTag(tag, { expire: 0 })` — immediate
  expiry, because a request arriving from another app cannot use `updateTag`.
- **i18n:** CMS identity/about content comes from `i18n_translations`; fixed
  headings, career vocabulary, privacy subtitle and site chrome come from
  local EN/IT files. `withSiteCopy` merges local strings over stale database
  values. Localized entry fields and privacy-policy bodies remain CMS content.

## Site Chrome & Footer Identity

Structural copy lives in `src/i18n/messages/site.{en,it}.json`: navigation,
footer chrome, Skills/Career/Portfolio/Blog/Contacts headings, career date and
remote vocabulary, post labels and the privacy subtitle. `withSiteCopy` in
`src/i18n/siteCopy.ts` merges these messages over database values.

| Content | Source | Owner |
| --- | --- | --- |
| Header images, navigation, footer name | Bundled assets and local code/copy | Website |
| Header images (custom override) | `site_settings.header_logo_dark` / `header_logo_light` | CMS Layout |
| Resume PDFs (EN/IT) | `hero_section.resume_en` / `resume_it` | CMS System → Resume |
| VAT number | `site_settings.footer_vat_number` | CMS Layout |
| Hero name, ordered roles, about | `hero-section` translations | CMS Hero |
| Skill categories and entries | `skills_categories` / `skills`, dense positions | CMS Skills |
| Contact links and SVG icon URLs | `contacts`, dense positions | CMS Contacts |

VAT is textual and displayed/copied verbatim; when it is null or blank the
footer renders no VAT affordance at all (there is no local default), and the
footer name stays `Okazakee`. Each header image is
independent: a null one renders that theme's bundled asset, so clearing dark
leaves a custom light image in place (and vice versa). One nonblank role
animates to completion once; multiple roles loop in their saved order.
Reduced motion shows static readable roles.

The content-controls migration is applied only to `dev_staging`; this
checkout has not promoted schema or content changes to `public`. Production
release requires an explicit, separately reviewed cutover. Historical SQL must
never be replayed blindly against the production schema.

## Getting Started

### Prerequisites

- Bun 1.3+ (`packageManager: "bun@1.3.14"`)
- A Supabase project — the content schema is owned by the CMS repository; the
  public site only reads it

### Install

```bash
git clone https://github.com/Okazakee/okazakee-ws.git
cd okazakee-ws
bun install
cp .env.local.example .env.local   # then fill in the values below
bun run dev
```

### Environment

**Required**

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (project settings) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) — never a secret/service key |
| `DOMAIN_URL` | Production domain, e.g. `https://okazakee.dev` |

**Optional**

| Variable | Purpose |
| --- | --- |
| `APP_ENV` | `production` \| `staging` \| `development`; controls cache defaults and publish-date enforcement |
| `CONTENT_ENFORCE_PUBLISH_DATE` | Hide future-dated posts (`true`/`false`; default: production builds only) |
| `NEXT_PUBLIC_SITE_URL` | Site URL for metadata/OG images; set on Vercel |
| `NEXT_PUBLIC_CMS_URL` | Standalone CMS origin (footer "CMS" link; falls back to the legacy path, which the Proxy redirects) |
| `LEGACY_CMS_REDIRECT_HOST` | When set, legacy `/{locale}/cms*` URLs 307-redirect to the standalone CMS host |
| `CONTENT_REVALIDATION_SECRET` | Shared secret authenticating content-change events from the CMS |
| `UMAMI_ENABLED` | Enable Umami analytics (`true`/`false`) |
| `ISR_REVALIDATION` | Cache lifetime in seconds (content caches + GitHub stars fetch); default `86400` in production, `600` otherwise |

**`NEXT_PUBLIC_SUPABASE_DB_SCHEMA` must be set for local work.** `public` holds
production content; local development reads `dev_staging`, a cloned schema in the
same Supabase project. The variable defaults to `public` when unset, and that
fallback is not survivable here: `site_settings` and `project_requests` exist
only in `dev_staging`, so a build against `public` dies on
`PGRST205 — Could not find the table 'public.site_settings'` while prerendering
every post page.

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev_staging
```

Storage and Auth are project-level. The CMS selects `website-dev` for staging
and refuses non-production writes to a real project's `public` schema.
Staging user removal leaves shared Auth identities untouched. Both local apps
must use `NEXT_PUBLIC_SUPABASE_DB_SCHEMA=dev_staging`, with matching local
revalidation secrets and endpoints.

### Scripts

```bash
bun run dev       # Development server (Turbopack)
bun run build     # Production build
bun run start     # Production server
bun run lint      # Biome lint
bun run lint-fix  # Biome lint + autofix
bun run format    # Biome format
bun run test      # Vitest test suite
```

## Deployment

1. Build locally to verify: `bun run build`
2. Configure environment variables on the platform (Vercel: Project Settings
   → Environment Variables)
3. Ensure the Supabase project exposes the public schema (owned by the CMS
   repo), the view-counter RPCs (`increment_blog_post_views_bigint`,
   `increment_portfolio_post_views_bigint`) and the `website` storage bucket
   with public read policies
4. Deploy (Vercel: merging into `master` — production — or `beta` — preview —
   triggers a build; direct pushes to those branches are not the release path,
   see AGENTS.md §13.1):

**Vercel preset:** Framework Next.js, build command `bun run build`, output
`.next`.

**Recommended cache setup:** set `ISR_REVALIDATION=86400` on production and
`600` on the beta preview branch (branch-scoped env).

## Testing & CI

- **Unit tests:** `bun run test` (Vitest, `src/**/*.test.ts`) — covers the
  cache-tag vocabulary, the signed revalidation contract, legacy-CMS and
  post-slug routing, JSON-LD structured data and the theme store.
- **CI** (`.github/workflows/ci.yml`, on `master`/`beta` and pull requests):
  install → lint → test → build → typecheck. Build runs before typecheck
  because a fresh checkout needs `.next/types` for route and image module
  resolution.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Build errors | Check environment variables, Node/Bun version, clear `.next` |
| Cache not updating | Verify `WEBSITE_REVALIDATION_SECRET` (CMS) equals `CONTENT_REVALIDATION_SECRET` (this repo); inspect CMS logs for `[revalidation]` failures |
| Missing content | Ensure tables exist (schema owned by the CMS repo) and RLS allows public reads |
| Images not loading | Check the `website` storage bucket, policies, file size limits |
| Translations missing | Verify `i18n_translations` in Supabase (managed from the CMS) |

## License

[MIT](LICENSE)
