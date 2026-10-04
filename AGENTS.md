## 1. Overview

Next.js 16 personal portfolio and blog. TypeScript throughout, React 19, Supabase for storage/DB (content + RPCs), Tailwind CSS 4 for styling, Zustand for client state, and next-intl for EN/IT i18n. The app router routes all pages under `/[locale]/...`.

> **CMS decoupled (2026-08):** content editing lives in the standalone
> `Okazakee/okazakee-cms` repo (public). This repo is public-site only: no
> CMS routes, actions, components, hooks, stores or elevated Supabase
> credentials. The public cache vocabulary lives in
> `src/libs/content/cacheTags.ts`; the CMS sends signed content-change events
> to `/api/internal/content-revalidate`, which validates them (HMAC, replay
> window, hard-coded tag allowlist) and calls `revalidateTag(tag, 'max')`.
> Legacy `/{locale}/cms*` URLs redirect to the CMS via
> `LEGACY_CMS_REDIRECT_HOST` in `src/proxy.ts`.

## 2. Repository Structure

```
src/
  app/
    [locale]/                       # Next.js app router pages (i18n route group)
      [post_type]/[id]/[title]/     # Blog/portfolio post detail pages
    actions/                        # Server actions ('use server')
      getCurrentViews.ts            # View count fetcher
      incrementViews.ts             # View count incrementer
      search.ts                     # Search action
    providers.tsx                   # Client providers (ThemeProvider)
    api/internal/                   # content-revalidate route (signed CMS events)
    globals.css                     # Design tokens (§1) + prose/code/counters
    robots.ts                       # robots.txt
    sitemap.ts                      # Sitemap; slugs via utils/postHref
  components/
    common/                         # Reusable public components (PostCard, Searchbar, ImageModal, etc.)
    layout/                         # Layout components (Header, Footer, NavMenu, ThemeToggle, LanguageToggle, NextImage, MarkdownRenderer)
    layout/mainPage/                # Page-specific sections (Hero, Skills, Career, Contacts, PostSections)
  config/                           # Env + runtime config (public, shared)
  hooks/                            # Client hooks (useZoom)
  i18n/                             # next-intl config (routing, request) + public messages
  libs/content/                     # Public cache-tag vocabulary + revalidation contract
  store/                            # Zustand stores (themeStore)
  types/                            # Shared domain types (fetchedData.types)
  utils/                            # Utilities (getData, tokenBucket, formatDate, Supabase stateless client)
  proxy.ts                          # Proxy handler for Vercel deployment (not app code)
```

> **Repo-wide:** New modules go in `src/` under the directory matching their role (components, actions, hooks, utils, store, types, libs). Nothing outside `src/` except config files.

## 5. Commands and Workflows

- Install: `bun install`
- Post-install patch: `node src/utils/patchNextTypeScript7.mjs` (runs
  automatically via the `postinstall` script; teaches Next's internal
  type-check loader about the TypeScript 7 package layout)
- Dev server: `bun run dev`
- Build: `bun run build`
- Start production: `bun run start`
- Lint: `bun run lint` (runs `biome lint .`)
- Lint + auto-fix: `bun run lint-fix` (runs `biome check . --write --unsafe`)
- Format: `bun run format` (runs `biome format . --write`)
- Test: `bun run test` (runs `vitest run`)
- Type check: `bunx tsc --noEmit`

CI (`.github/workflows/ci.yml`, `master`/`beta` + PRs) runs install → lint →
test → build → typecheck (build before typecheck: fresh checkouts need
`.next/types`).

## 6. Code Formatting

> **Repo-wide:** Biome 2.5 is the formatter and linter. Config lives at `biome.json`. The editorconfig at `.editorconfig` mirrors indent/line-ending settings.

### TypeScript / TSX

```typescript
// biome.json excerpt
//   indentStyle: "space", indentWidth: 2, lineWidth: 80
//   quoteStyle: "single", trailingCommas: "es5"
```

- **Indentation:** 2 spaces. Never tabs.
- **Line length:** 80 characters (Biome configured limit). Actual p95 is 86 chars.
- **Quote style:** Single quotes for strings. Double quotes only when the string contains a single quote.
- **Semicolons:** Always present at end of statements.
- **Trailing commas:** ES5-style (multi-line objects, arrays, function params).
- **Brace placement:** Same-line (K&R) for all constructs.
- **Blank lines between top-level definitions:** 1 blank line.
- **Blank lines between methods/functions:** 1 blank line (rarely observed).
- **Blank lines after imports:** 1 blank line before first definition.
- **Trailing newline:** Always present at EOF.
- **Trailing whitespace:** Never present (Biome strips it).
- **Spacing — operators:** `x = 1` (single space around `=`, `+`, `-`, etc.).
- **Spacing — inside brackets:** `f(x)` not `f( x )`. `{ key: value }` not `{key:value}`.
- **Spacing — after commas:** `a, b` (single space after comma).
- **Spacing — colons in types:** `key: Type` (space after colon, no space before).
- **Spacing — decorators/semicolons:** No blank line before decorator; no decorators used in this codebase.
- **Import block formatting:** One import per line (default Biome behavior with `organizeImports: "on"`).
- **Line continuation:** Implicit via open bracket/parenthesis (no backslash).

Real snippet demonstrating the composite style:

```typescript
import { create } from 'zustand';
import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  meta?: string;
  actions?: ReactNode;
}

export function SectionHeader({
  title,
  description,
  meta,
  actions,
}: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
```

## 7. Naming Conventions

### TypeScript

- **Variables:** camelCase. `const rateLimitKey = ...`
- **Functions:** camelCase. Prefer `get`/`handle`/`use` prefixes where semantically appropriate. `getUser()`, `handleSubmit()`, `useDraft()`
- **React components:** PascalCase, named exports. `export function SectionHeader(...)`
- **Component props interfaces:** `{ComponentName}Props`. `SectionHeaderProps`, `ErrorBannerProps`
- **Types and interfaces:** PascalCase. `PostAuthor`, `ThemeState`, `BlogPost`
- **Type aliases for discriminated unions:** `{Entity}Result` for operation results. `ContactsResult`, `I18nResult`
- **Data types:** `{Entity}Data` suffix. `PostWithAuthor`, `CreateContactData`
- **Zustand stores:** `use{Name}Store`. `useThemeStore`
- **Server action files:** camelCase with domain prefix. `getCurrentViews.ts`, `incrementViews.ts`, `search.ts`
- **Section action files:** `{section}Actions.ts`. `blogActions.ts`, `careerActions.ts`
- **Component files:** PascalCase matching component name. `SectionHeader.tsx`, `TranslationField.tsx`
- **Hook files:** `use{HookName}.ts`. `useDraft.ts`, `useFileUpload.ts`
- **Utility files:** camelCase. `getData.ts`, `rateLimiters.ts`, `postHref.ts`
- **Constants at module level:** camelCase (not SCREAMING_SNAKE_CASE). `const production = ...`, `const revalTime = ...`

## 8. Type Annotations

- **Strict mode:** `tsconfig.json` has `"strict": true`. No `any` permitted.
- **Type imports:** Use `import type { Foo } from '...'` for type-only imports. Runtime imports use regular `import { create } from 'zustand'`.
- **Nullable:** Use `X | null` (not `X | undefined` for missing values).
- **Optional properties:** Use `key?: Type` in interfaces.
- **Union types:** `'admin' | 'editor'`, `RemoteType = 'full' | 'hybrid' | 'onSite'`
- **Export inline types:** Types are defined in the same file where they are primary consumers, not in a separate `.d.ts` unless shared across modules.
- **Return types:** Explicit return types on public API functions. `export async function signup(...): Promise<...>`. Internal helper functions may omit return types.
- **Type assertion with `as`:** Used sparingly for Supabase query results.

```typescript
export type ThemeMode = 'light' | 'dark' | 'auto';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
}

export async function getPosts(): Promise<BlogPost[] | null> {
  // ...
}
```

## 9. Imports

- **Ordering:** third-party packages first, then `@/` aliased local imports. Biome's `organizeImports` handles exact ordering.
- **Side-effect imports** (like `import '../globals.css'`) go at the top.
- **Path aliases** defined in `tsconfig.json`:

| Alias | Maps to | Used |
|---|---|---|
| `@/*` | `./src/*` | yes |
| `@components/*` | `./src/components/*` | yes |
| `@layout/*` | `./src/components/layout/*` | yes |
| `@utils/*` | `./src/utils/*` | yes |
| `@public/*` | `./src/app/public/*` | yes (logos, fonts) |
| `@libs/*` | `./src/libs/*` | no — import via `@/libs/*` |
| `@types/*` | `./src/types/*` | no — import via `@/types/*` |
| `@store/*` | `./src/store/*` | no — import via `@/store/*` |
| `@app/*` | `./src/app/*` | no — import via `@/app/*` |
| `@api/*` | `./src/app/api/*` | no |
| `@config/*` | `./*config.ts` | no — **dead**, resolves to the repo root; config lives in `src/config/`, import via `@/config/*` |
| `@blog/*` `@portfolio/*` `@fonts/*` `@styles/*` | `./src/blog/*` etc. | no — no matching directories exist |

- **Supabase clients:** The public site is read-only and every client is
  stateless, built from `publicConfig` with the publishable key
  (`@supabase/supabase-js`). There are three module-level instances — the read
  layer (`src/utils/getData.ts`) and the two view-counter server actions
  (`src/app/actions/getCurrentViews.ts`, `src/app/actions/incrementViews.ts`).
  There is no server/client/admin Supabase client in this repo — the CMS owns
  all writes. Never add elevated keys here.
- **Never use relative imports** for anything outside the immediate sibling directory. Always use `@/` aliases.

```typescript
// Canonical import block
import '../globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { Suspense } from 'react';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ScrollTop from '@/components/layout/ScrollTop';
import { getTranslationsSupabase } from '@/utils/getData';
```

## 10. Error Handling

- **Server actions** use try/catch with `console.error` and return `{ success: false, error: string }`:

```typescript
export async function getCurrentViews(postId: string, postType: 'blog' | 'portfolio') {
  try {
    const supabase = createClient(url, publishableKey);
    // ...
    if (error) {
      console.error('Error fetching current views:', error);
      return { success: false, error: error.message };
    }
    return { success: true, views: data?.views || 0 };
  } catch (error) {
    console.error('Error in getCurrentViews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

- **Client components** catch errors from server action calls and display via UI state (often the `ErrorDiv` component).
- **Supabase `PGRST116`** (zero rows from `.single()`) is handled as a non-error: return `null`.
- **Bare `catch`** (without error variable) is used when the error is intentionally ignored (e.g., Supabase `setAll` in server component cookie handler).
- **No global error boundary** is configured. Each route handles its own error state.
- **Custom errors** are not defined. The codebase uses `Error` instances and string messages.

## 11. Comments and Docstrings

- **Docstrings:** Not used systematically. Module doc comments appear only where a module's contract needs stating (e.g. `src/libs/content/cacheTags.ts`, `src/libs/content/revalidation.ts`); components carry a one-line pointer to their `docs/DESIGN.md` section.
- **Inline comments:** `//` style, used sparingly to explain intent or document edge cases, not what the code does.
- **No module-level docstrings.**
- **No commented-out code** in observed files. Biome linter likely prevents dead code.
- **Supabase/RPC comments:** Keep inline comments when the API behavior is non-obvious.

```typescript
// Skip API calls for preview or non-numeric post id (e.g. CMS post preview)
const numericId = postId.trim() !== '' && /^\d+$/.test(postId);
```

## 12. Testing

Vitest is configured (`vitest.config.ts`, node environment; a file opts into
`happy-dom` with a `@vitest-environment` docblock, as `themeStore.test.ts`
does). Tests live next to sources as `*.test.ts` (currently: cache-tag
vocabulary, the revalidation contract, legacy-CMS route matching, post href /
title slugging, JSON-LD structured data and the theme store). Run with
`bun run test` (`vitest run`). CI (`.github/workflows/ci.yml`) runs lint,
test, build, then typecheck (build first: fresh checkouts need `.next/types`
for image/route module resolution). When tests are added, follow existing
conventions for file placement, naming, and structure.

## 13. Git

### 13.1 Branch and PR workflow (mandatory)

`master` is the integration branch and must stay releasable. Every change —
feature, fix, refactor, docs, dependency bump — is made on a dedicated branch
and merged through a pull request.

**Two owner gates.** Nothing opens or merges on the agent's own initiative:
the PR is opened only after the owner confirms the branch is complete, and
the merge follows review. Pushing a branch is not permission to open a PR,
and being asked to make a change is not permission to open one either.

1. Branch from the latest `master` (or `beta` when the change belongs to the
   beta line): `<type>/<short-slug>`, e.g. `fix/view-counter-reset`,
   `feat/cms-revalidation`.
2. Commit only on that branch. `master` and `beta` never receive direct
   commits.
3. Push the branch when the work is ready — and stop there.
4. Open the PR against `master` (or `beta`) with `gh pr create` only after the
   owner confirms the branch is done. The body describes the change, the
   affected contract, and the checks run.
5. CI (`.github/workflows/ci.yml`) must be green before merge.
6. Merge with a merge commit (`gh pr merge --merge`); never squash or rebase,
   never force-push `master`/`beta`.
7. Delete the merged branch.

**Exception — you ask for it.** A direct commit/push to `master`/`beta` is
allowed only when you explicitly ask for one in the session (for example
"push this to master"). That request is the authorization; the agent never
decides on its own that a direct push is warranted. When it happens:

- keep the diff to the minimum that resolves the issue, with a commit
  message that states why it went straight to the branch;
- no force-push, history rewrite, or unrelated cleanup in the same commit;
- open a follow-up PR (or review) if the result is not trivially verifiable.

Without that explicit request, work goes through a branch and a PR, however
urgent it feels.

### 13.2 Commit and merge conventions

- **Commit prefixes:** Conventional commits are used alongside unprefixed messages. Observed prefixes: `fix:`, `feat:`, `refactor:`, `chore:`, `revert:`, `security:`, `docs:`.
- **Scoped commits:** Rare (3.7% of commits). Scopes are lowercase: `auth`, `images`.
- **Subject length:** p50 is 23 chars, p95 is 72 chars. Keep subjects concise.
- **Body:** Only 13% of commits have a body. No strict convention.
- **Branch naming:** `<type>/<short-slug>` (lowercase), see §13.1. `beta` is a long-lived line branch, not a feature branch.
- **Merge strategy:** Merge commits (not squash or rebase), always via PR.
- **No GPG signing.**

## 14. Dependencies and Tooling

- **Package manager:** bun (`packageManager: "bun@1.3.14"` in `package.json`). Always use `bun` not `npm`/`yarn`/`pnpm`.
- **Lockfile:** `bun.lock` — committed to the repo.
- **Add dependency:** `bun add <package>` (prod) or `bun add -d <package>` (dev).
- **Linter/Formatter:** Biome 2.5. Config: `biome.json`.
- **Type checker:** TypeScript 7 with `strict: true`. Config: `tsconfig.json`. `next build` skips its internal type check on TS 7 (patched by the `postinstall` script), so `bunx tsc --noEmit` is the only typecheck that runs — CI relies on it.
- **CSS:** Tailwind CSS 4 with `@tailwindcss/postcss`. Config: `postcss.config.mjs`, `tailwind.config.ts`.
- **Runtime:** Next.js 16 with Turbopack dev server. Config: `next.config.ts`.
- **Environment variables:** Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `DOMAIN_URL`. Full list in `.env.local.example`.
- **Deployment:** Vercel with Next.js framework preset. Build output: `.next/`.

## 15. Red Lines

- **Never use double quotes for string literals** in `.ts`/`.tsx` files. Use single quotes. Biome enforces this.
- **Never use tabs for indentation.** Use 2 spaces.
- **Never use `any`.** TypeScript strict mode is enabled. If you need escape-hatch typing, use `unknown` and narrow.
- **Never use relative imports across directory boundaries.** Use `@/` path aliases defined in `tsconfig.json`.
- **Never call Supabase directly from client components (browser).** Use server actions (`'use server'`) to proxy all Supabase calls.
- **Never commit `.env.local`** or any file containing secrets.
- **Never commit or push directly to `master`/`beta`.** Work on a branch and open a PR — the only exception is a direct push you explicitly asked for in the session (§13.1).
- **Never open a PR, or merge one, without the owner's go-ahead.** A pushed branch is not a PR request; wait for confirmation (§13.1).
- **Never add a `'use server'` directive inside a file that also has `'use client'`.** These directives are mutually exclusive at the file level.
- **Never import server-only modules (like `next/headers`, `next/cache`) into client components.** Keep server and client code separated.
- **Never use `console.log` in production paths.** Use `console.error` for server-side error logging. The one documented exception is the revalidation route's `[content-revalidate]` success event log.
- **Never define React component state inline in the JSX render path.** Use Zustand stores for shared state, `useState`/`useReducer` for local state.
- **Never add a dependency with npm/yarn/pnpm** — always use `bun add`.
- **Never export a component as default** unless it is a Next.js page or layout file. Use named exports.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
