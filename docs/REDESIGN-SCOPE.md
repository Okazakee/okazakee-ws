# Redesign scope — page set, design canon, open questions

Status: scope agreed, no implementation started. This file is the requirement
source for the redesign: mockup work (Google Stitch), implementation, and
future agent sessions all read the same page list, states and token names.

Canon lives in two places, neither of which is implementation truth:

- `docs/DESIGN.md` — Stitch-generated brand/style brief (component-level).
- `docs/REDESIGN-SCOPE.md` — this file: page inventory, decisions, unknowns.

`tailwind.config.ts` + `src/app/globals.css` stay authoritative for what
actually ships. When this file and the code disagree, the code wins and this
file is wrong and needs updating.

## 1. Reference artifacts

| Artifact | Location | Notes |
|---|---|---|
| Homepage prototype | `~/Downloads/stitch_okazakee_hybrid_tui_interface/code.html` | Rendered, dark-only, single scroll |
| Prototype screenshot | `~/Downloads/stitch_okazakee_hybrid_tui_interface/screen.png` | Same render, full page |
| Style brief | `docs/DESIGN.md` | Component specs; palette/type conflicts, see §3 |

The prototype HTML is intentionally **not** committed: it pulls Tailwind,
Geist, Space Grotesk, JetBrains Mono and Material Symbols from CDNs and
embeds ephemeral `lh3.googleusercontent.com` image URLs. It is a reference
render, not source material to copy.

What the prototype covers: header (logo, mono nav anchors, EN/IT toggle,
theme toggle, Resume), hero, about, skills (4 groups), career timeline
(4 entries), portfolio (3 cards), blog (3 cards), contacts (5 cards), footer,
scroll-to-top. Section ids: `#home` `#about` `#skills` `#career` `#portfolio`
`#blog` `#contacts`.

Known mockup gaps: no mobile nav (nav is `hidden md:flex`, no drawer), no
light theme, list pages hardcode 3 cards, "Explore more" links are
placeholders, no detail pages, no search/empty/error/loading states, no image
lightbox, no privacy page, no 404.

## 2. Palette canon

Decided (owner, this redesign): the **rendered prototype palette** is
canonical. It is the only variant that has been rendered end to end. Token
names below are the vocabulary every mockup and the implementation must use.

| Token | Hex | Role |
|---|---|---|
| `surface-base` | `#0c0f17` | page canvas, header/footer backdrop |
| `surface-alt` | `#0e121a` | alternating section band (`bg-[#0e121a]`) |
| `surface-card` | `#131722` | cards, panels, code-block header |
| `surface-card-hover` | `#171c2b` | card hover |
| `surface-raised` | `#1a1f30` | chips, meta pills, inset rows |
| `border-subtle` | `#232938` | default 1px border |
| `border-hover` | `#374158` | border on hover/interaction |
| `accent-violet` | `#a078ff` | primary accent: CTAs, active nav, timeline pins |
| `accent-violet-light` | `#c4b5fd` | accent text on dark, links, section subtitles |
| `accent-violet-deep` | `#7c3aed` | filled button base, selection, deepest accent |
| `accent-cyan` | `#38bdf8` | data/tech tokens, status-adjacent highlights |
| `text-white` | `#f8fafc` | headings |
| `text-main` | `#e2e8f0` | body copy |
| `text-muted` | `#94a3b8` | secondary copy, meta |
| `text-dim` | `#64748b` | footnotes, empty-state copy |
| `status-active` | `#10b981` | online/active pip only |

Superseded values (keep only as historical aliases, do not reintroduce):
`DESIGN.md` frontmatter MD3 set (`#d0bcff`, `#fbabff`, `#4cd7f6`, `#12131a`,
`#e3e1ec`) and `DESIGN.md` prose set (`#8B5CF6`, `#D946EF`, `#06B6D4`,
`#0A0B10`, `#0D0E15`, `#131520`, `#1A1D2D`, `#23273B`, `#F3F4F6`,
`#94A3B8`, `#4B5563`). `docs/DESIGN.md` still needs reconciling against this
table — tracked in §6.

## 3. Typography

Prototype (rendered) overrides `DESIGN.md`'s Inter:

- Display/headings: **Space Grotesk**, tracking-tight.
- Body: **Geist**.
- Labels/meta/nav/buttons: **JetBrains Mono**, uppercase, tracked
  (`0.04em`–`0.08em`) at small sizes.

Self-host all three via `next/font` (`next/font/local` is what the repo uses
today for `whiterabbit.woff2`). No CDN `<link>` in shipped code. No Material
Symbols; icons come from `lucide-react` + brand SVGs already in the repo
(`src/components/common/BrandIcons.tsx`).

## 4. Provisional rules for mockups

Not owner-confirmed, but pinned so mockups stay consistent with each other.
Veto any of these and this section changes:

- Where `DESIGN.md` prose and the rendered prototype disagree, **the
  prototype is visual canon**.
- Surfaces: cards `rounded-2xl` (16px), chips/pills `rounded-md`/`rounded-lg`,
  avatars and status pips `rounded-full`. `DESIGN.md`'s 8px/12px radius scale
  and "no diffuse shadows" rule are not followed by the prototype and are
  suspended.
- Depth: 1px `border-subtle`; on hover an accent border plus a soft
  accent-tinted glow (`shadow-accent-violet/5`–`/30`). No neutral drop
  shadows.
- Layout: `max-w-5xl` for full sections, `max-w-3xl`/`max-w-4xl` for prose
  columns, `px-6`, section padding `py-16`–`py-24`, alternating
  `surface-base` / `surface-alt` bands separated by `border-t`.
- Section headers: centered title (Space Grotesk semibold, `text-white`),
  mono subtitle in `accent-violet-light`, 40px `accent-violet` underline rule.
- Every page keeps the same sticky header and footer as home.

## 5. Open questions

1. **Light mode**: the site currently supports `light | dark | auto`
   (`src/store/themeStore.ts`, `darkMode: 'selector'`). The prototype is
   dark-only. Decide: design light equivalents, or drop light mode.
2. **Destructive/error accent**: prototype never draws it. Candidates are the
   prose magenta `#D946EF` or the MD3 error pair (`#ffb4ab` / `#93000a`).
3. **Nav information architecture**: prototype nav points `Portfolio`/`Blog`
   at home anchors, but `/[locale]/portfolio` and `/[locale]/blog` are real
   routes and the home sections only show the latest 3. Decide: nav scrolls
   to sections, or navigates to list pages.
4. **Radius/shadow rule** in §4, if you disagree with the prototype.
5. **Contact set**: prototype shows 5 cards (Email, LinkedIn, GitHub,
   Telegram, Resume); confirm the final set against
   `src/components/layout/mainPage/Contacts.tsx`.

## 6. Required screens

Tier 1 — stresses the system; request these first, in this order.

1. **Blog list** `/[locale]/blog` — mono page header, search field, tag
   filter row, responsive card grid, sort control, pagination or load-more.
   States: default, no results, rate limited.
2. **Portfolio list** `/[locale]/portfolio` — same shell; project cards carry
   stars, stack chips, platform badges.
3. **Blog post detail** `/[locale]/blog/[id]/[title]` — hero image, title,
   date + read time + views, tags, author block, share, then the full markdown
   prose layer (h2/h3, lists, blockquote, links, inline code, tables) and a
   code block with copy button, plus captioned image figures.
4. **Portfolio project detail** `/[locale]/portfolio/[id]/[title]` — same
   shell plus platform links (web / iOS / Play), source + live links, GitHub
   stars, screenshot gallery.
5. **Privacy policy** `/[locale]/privacy-policy` — long-form legal
   typography, "last updated", numbered sections, optional TOC/anchors.
6. **404 not found** — terminal-flavoured, back-home CTA. Two real variants:
   site level (`src/app/[locale]/not-found.tsx`) and post level
   (`.../[post_type]/[id]/[title]/not-found.tsx`).

Tier 2 — states and variants of surfaces that already exist.

7. Home in light mode (if §5.1 keeps light).
8. Home with mobile nav open (`hidden md:flex` nav has no drawer today).
9. Loading skeletons for list + detail (`loading.tsx` does not exist yet).
10. Image lightbox (`ImageModal`).
11. Error page (`error.tsx`, retry CTA).

Tier 3 — treat as states, not screens: `no-posts` / `ratelimit` strings
(already real translation keys in `posts-section`), IT locale text-expansion
checks on career timeline and post detail, resume/contact button states.

## 7. Existing routes (evidence)

| Route | File |
|---|---|
| `/[locale]` home | `src/app/[locale]/page.tsx` |
| `/[locale]/[post_type]` list (`blog`, `portfolio`) | `src/app/[locale]/[post_type]/page.tsx` |
| `/[locale]/[post_type]/[id]/[title]` detail | `src/app/[locale]/[post_type]/[id]/[title]/page.tsx` |
| `/[locale]/privacy-policy` | `src/app/[locale]/privacy-policy/page.tsx` |
| 404 / error | `src/app/[locale]/{not-found,error}.tsx`, post-level equivalents |
| `robots.txt`, `sitemap.xml` | `src/app/robots.ts`, `src/app/sitemap.ts` |
| revalidation endpoint | `src/app/api/internal/content-revalidate/route.ts` |

Home renders `src/components/layout/mainPage/`: Hero, Skills, Career,
Contacts, PostsSections. The prototype additionally introduces an About
section; contact/skill/career copy in the prototype is real content, not
lorem.

Components the redesign will re-skin: `common/PostCard`, `common/PostList`,
`common/Searchbar`, `common/Tags`, `common/ViewDisplay`, `common/GitHubStars`,
`common/ShareButton`, `common/ResumeButton`, `common/ImageModal`,
`layout/MarkdownRenderer`, `layout/PreCustom`, `layout/Header`,
`layout/NavMenu`, `layout/Footer`, `layout/LanguageToggle`,
`layout/ThemeToggle`, `layout/NextImage`.

## 8. Non-goals

- No changes to data fetching, Supabase access patterns, cache tags
  (`src/libs/content/cacheTags.ts`) or the CMS revalidation contract. The
  redesign is presentational.
- No CMS-side changes; `okazakee-cms` is untouched by this project.
- No routing/URL changes for existing pages.
- Quality gates stay: `bun run lint`, `bun run test`, `bun run build`,
  `bunx tsc --noEmit` must pass (see `AGENTS.md` §5, §12).
