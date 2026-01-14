# Okazakee Workspace

A modern personal portfolio and blog website built with Next.js 15, featuring an integrated CMS with role-based access control and multi-language support.

## 🚀 Features

**Public Website:**
- Hero section, skills carousel, career timeline
- Portfolio projects and blog posts with search
- Dark/Light/Auto theme, multi-language (EN/IT)
- View tracking, SEO optimization, responsive design

**CMS:**
- Role-based access (Admin/Editor)
- Section management (Hero, Skills, Career, Portfolio, Blog, Contacts, Layout, Privacy Policy)
- Email/Password + GitHub OAuth authentication
- Auto-save, live previews, image optimization, markdown support

## 🛠️ Tech Stack

**Framework:** Next.js 15, TypeScript, React 19  
**Styling:** Tailwind CSS 4, Lucide React  
**Backend:** Supabase (PostgreSQL + Auth + Storage)  
**i18n:** next-intl (EN/IT)  
**State:** Zustand  
**Tools:** Biome, Turbopack

## 🏗️ Architecture

**Routing:** `/[locale]/[post_type]/[id]/[title]` structure with i18n  
**Components:** Server Components for data/SEO, Client Components for interactivity  
**State:** Zustand stores (`layoutStore`, `themeStore`)  
**Supabase:** Server/client clients + middleware for session management

## 🚦 Getting Started

### Prerequisites

- Node.js 18+ and Yarn 1.22+
- Supabase account

### Installation

1. Clone and install:

```bash
git clone <repository-url>
cd okazakee-ws
yarn install
```

2. Create `.env.local`:

```env
# Required - Get from Supabase project settings (Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here
DOMAIN_URL=http://localhost:3000

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UMAMI_ENABLED=false
NEXT_PUBLIC_LOCALES=en,it
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

3. Set up Supabase:
   - Create project and get URL/anon key
   - Create tables: `user_profiles`, `cms_allowed_users`, `blog_posts`, `portfolio_posts`, `skills`, `career_entries`, `contacts`, `hero`, `resume`, `i18n_translations`, `layout_settings`, `privacy_policy`
   - Create functions: `increment_blog_post_views_bigint`, `increment_portfolio_post_views_bigint`
   - Create storage bucket: `website`
   - Configure RLS policies

4. Run dev server:

```bash
yarn dev
```

## 🔐 Environment Variables

**Required:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (from project settings)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (from API settings)
- `DOMAIN_URL` - Production domain (e.g., `https://example.com`)

**Optional:**
- `UMAMI_ENABLED` - Enable Umami analytics (`true`/`false`)
- `NEXT_PUBLIC_LOCALES` - Comma-separated locales (default: `en,it`)
- `NEXT_PUBLIC_DEFAULT_LOCALE` - Default locale (default: `en`)

## 📝 Scripts

```bash
yarn dev      # Development server
yarn build    # Production build
yarn start    # Production server
yarn lint     # Lint code
yarn format   # Format code
```

## 🎨 Development

**Structure:**
- `components/common/` - Reusable components
- `components/common/cms/` - CMS components
- `app/actions/` - Server actions (`'use server'`)
- `utils/` - Utilities and Supabase clients

**Adding CMS Sections:**
1. Create component in `components/common/cms/`
2. Add actions in `app/actions/cms/sections/`
3. Register in `app/[locale]/cms/page.tsx` and `SidePanel.tsx`

**i18n:** Translations in Supabase `i18n_translations` table. Use `getTranslations()` (server) or `useTranslations()` (client).

## 🚀 Deployment

1. Build: `yarn build`
2. Set environment variables in your platform (Vercel: Project Settings → Environment Variables)
3. Configure Supabase:
   - Set up tables, functions, RLS policies
   - Configure storage buckets and CORS
   - Configure OAuth (GitHub) with production redirect URLs
4. Deploy: Push to main branch or trigger manual deployment

**Vercel:** Framework Preset: Next.js, Build Command: `yarn build`, Output: `.next`

## 📖 CMS Usage

**Access:** Navigate to `/[locale]/cms/login`, sign in with email/password or GitHub OAuth.

**Roles:**
- **Admin:** Full access to all sections, user management
- **Editor:** Portfolio and Blog sections only

**Content Management:**
- **Blog/Portfolio:** Create/edit posts with markdown, tags, images
- **Other Sections:** Hero, Skills, Career, Contacts, Layout, Privacy Policy (Admin only)
- **Users:** Add/edit/delete users, manage roles (Admin only)
- **Account:** Update profile, change password, delete account

## 🐛 Troubleshooting

**Build Errors:** Check env vars, Node.js version, clear `.next` folder  
**Auth Issues:** Verify Supabase credentials, check `cms_allowed_users` table, OAuth redirect URLs  
**Database:** Ensure tables exist, check RLS policies, verify functions  
**Images:** Check storage bucket config, policies, file size limits  
**i18n:** Verify translations in database, check locale routing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and run `yarn lint && yarn format`
4. Commit and push
5. Open a Pull Request

**Code Style:** TypeScript best practices, Biome linting/formatting, meaningful commits

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ using Next.js, TypeScript, and Supabase
