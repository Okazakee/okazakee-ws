# Okazakee Website

A modern personal portfolio and blog website built with Next.js 16, with
multi-language support. Content is managed by a **separate standalone CMS**
([Okazakee/okazakee-cms](https://github.com/Okazakee/okazakee-cms), private,
live at [cms.okazakee.dev](https://cms.okazakee.dev)) which writes to the
same Supabase project and invalidates public caches via a signed revalidation
endpoint (`POST /api/internal/content-revalidate`).

## 🚀 Features

**Public Website:**
- Hero section, skills carousel, career timeline
- Portfolio projects and blog posts with search
- Dark/Light/Auto theme, multi-language (EN/IT)
- View tracking, SEO optimization, responsive design

## 🛠️ Tech Stack

**Framework:** Next.js 16, TypeScript, React 19  
**Styling:** Tailwind CSS 4, Lucide React  
**Backend:** Supabase (PostgreSQL + Auth + Storage)  
**i18n:** next-intl (EN/IT)  
**State:** Zustand  
**Tools:** Biome, Turbopack

## 🏗️ Architecture

**Routing:** `/[locale]/[post_type]/[id]/[title]` structure with i18n  
**Components:** Server Components for data/SEO, Client Components for interactivity  
**State:** Zustand store (`themeStore`)  
**Supabase:** stateless publishable-key read client for content, RPCs and view counters  
**Caching:** Next Cache Components + `cacheTags` vocabulary (`src/libs/content/cacheTags.ts`);
the signed revalidation endpoint accepts content-change events from the CMS

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and Bun
- Supabase account

### Installation

1. Clone and install:

```bash
git clone <repository-url>
cd okazakee-ws
bun install
```

2. Create `.env.local`:

```env
# Required - Get from Supabase project settings (Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-key
DOMAIN_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UMAMI_ENABLED=false
ISR_REVALIDATION=86400
NEXT_PUBLIC_LOCALES=en,it
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

3. Set up Supabase:
   - The content schema (tables, RLS, storage) is owned by the standalone
     CMS repository ([Okazakee/okazakee-cms](https://github.com/Okazakee/okazakee-cms),
     private). The public site only READS content via the publishable key.
   - Public-site functions: `increment_blog_post_views_bigint`,
     `increment_portfolio_post_views_bigint`
   - Storage bucket: `website`
   - Configure RLS so public reads are allowed for `anon`

4. Run dev server:

```bash
bun run dev
```

## 🔐 Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (from project settings)
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase publishable key (`sb_publishable_…`; never use a secret/service key here)
- `DOMAIN_URL` - Production domain (e.g., `https://example.com`)

**Optional:**
- `APP_ENV` - Application environment: `production` | `staging` | `development` (defaults from `NODE_ENV`). Controls cache defaults and publish-date enforcement.
- `CONTENT_ENFORCE_PUBLISH_DATE` - Hide future-dated posts from public reads (`true`/`false`; default: production builds only)
- `NEXT_PUBLIC_SITE_URL` - Site URL used for metadata/OG; optional locally, set on Vercel
- `NEXT_PUBLIC_CMS_URL` - Standalone CMS origin (footer "CMS" link; falls back to the legacy `/{locale}/cms` path, which the Proxy redirects)
- `LEGACY_CMS_REDIRECT_HOST` - When set, legacy `/{locale}/cms*` URLs redirect (307) to the standalone CMS host
- `CONTENT_REVALIDATION_SECRET` - Shared secret authenticating content-change events from the standalone CMS (`POST /api/internal/content-revalidate`)
- `UMAMI_ENABLED` - Enable Umami analytics (`true`/`false`)
- `ISR_REVALIDATION` - Cache lifetime in seconds for both content caches and the GitHub stars fetch
  (default: `86400` in production, `600` otherwise)
- `NEXT_PUBLIC_LOCALES` - Comma-separated locales (default: `en,it`)
- `NEXT_PUBLIC_DEFAULT_LOCALE` - Default locale (default: `en`)

## 📝 Scripts

```bash
bun run dev       # Development server (Turbopack)
bun run build     # Production build
bun run start     # Production server
bun run lint      # Lint code
bun run lint-fix  # Lint and auto-fix
bun run format    # Format code
bun run test      # Run the Vitest test suite
```

## 🎨 Development

**Structure:**
- `src/components/common/` - Reusable components
- `src/app/actions/` - Server actions (`'use server'`): search, view counters
- `src/utils/getData.ts` - Cached public read layer (Next Cache Components)
- `src/libs/content/` - Public cache-tag vocabulary and revalidation contract
- `src/utils/` - Utilities and the stateless Supabase read client

**Caching:** public reads are cached with `cacheTag`/`cacheLife` using the
vocabulary in `src/libs/content/cacheTags.ts`. The CMS (separate repo) sends
signed content-change events to `/api/internal/content-revalidate`; the
endpoint validates them (HMAC, replay window, tag allowlist) and calls
`revalidateTag(tag, 'max')`.

**i18n:** Translations in Supabase `i18n_translations` table. Use `getTranslations()` (server) or `useTranslations()` (client).

## 🚀 Deployment

1. Build: `bun run build`
2. Set environment variables in your platform (Vercel: Project Settings → Environment Variables)
3. Configure Supabase:
   - Set up tables, functions, RLS policies
   - Configure storage buckets and CORS
   - Configure OAuth (GitHub) with production redirect URLs
4. Deploy: Push to main branch or trigger manual deployment

**Vercel:** Framework Preset: Next.js, Build Command: `bun run build`, Output: `.next`

**Recommended cache setup on Vercel:**
- Production: set `ISR_REVALIDATION=86400`
- Beta preview branch: set `ISR_REVALIDATION=600` with a branch-scoped preview env



## 🐛 Troubleshooting

**Build Errors:** Check env vars, Node.js version, clear `.next` folder  
**Cache not updating:** Verify the CMS's `WEBSITE_REVALIDATION_SECRET` matches this repo's `CONTENT_REVALIDATION_SECRET`; check the CMS logs for `[revalidation]` failures  
**Database:** Ensure tables exist (schema is owned by the CMS repo), check RLS policies, verify view-counter functions  
**Images:** Check storage bucket config, policies, file size limits  
**i18n:** Verify translations in database (managed from the CMS), check locale routing

## 🧪 Tests & CI

- Unit tests: `bun run test` (Vitest, `src/**/*.test.ts`) — covers the cache-tag
  vocabulary, the signed revalidation contract, and routing rules.
- CI (`.github/workflows/ci.yml`) runs on `master`/`beta` and pull requests:
  install → lint → test → build → typecheck (`bunx tsc --noEmit`). Build runs
  before typecheck because a fresh checkout needs `.next/types` for route and
  image module declarations.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and run `bun run lint && bun run format`
4. Commit and push
5. Open a Pull Request

**Code Style:** TypeScript best practices, Biome linting/formatting, meaningful commits

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Next.js, TypeScript, and Supabase
