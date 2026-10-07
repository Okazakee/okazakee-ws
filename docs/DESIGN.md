# Okazakee — Design System Canon

This document is the design contract for the redesigned site. It supersedes the
Stitch-generated brief that used to live here: the redesign is now the canon, and
where the two disagree this file wins.

Provenance of every value below: the approved HTML mockups in
`~/Downloads/stitch_okazakee_hybrid_tui_interface/` (`code.html`, `portfolio.html`,
`privacy-policy.html`, `error.html`, `blog-post.html`, `portfolio-post.html`) plus the
`precall` project for the request form. Values were verified by measuring the rendered
mocks (contrast ratios, box geometry, tap targets), not copied from a tool.

Source, tests and configuration remain authoritative for implementation detail; this
document owns the system: tokens, type, layout, component behaviour and the data rules.

---

## 1. Colour

### 1.1 Token mechanism

Tokens are consumed through CSS custom properties, never as raw hex in
components. The declaration differs by Tailwind version:

```css
/* repo — Tailwind v4: hex values, opacity comes from color-mix */
:root { --c-surface-base: #f4f5f9; }
.dark { --c-surface-base: #0a0a0a; }
```

```js
// repo — v4 resolves `bg-surface-base/85` with color-mix, no placeholder needed
colors: { 'surface-base': 'var(--c-surface-base)' }
```

```css
/* mockups — the Stitch files run the v3 Play CDN, which needs channel triplets */
:root { --c-surface-base: 244 245 249; }
```

```js
// mockups only — `<alpha-value>` keeps v3 opacity modifiers working
colors: { 'surface-base': 'rgb(var(--c-surface-base) / <alpha-value>)' }
```

Rules:

- Components reference token classes only (`bg-surface-card`, `text-text-muted`,
  `border-border-subtle`). No hexes, no arbitrary colour classes.
- `<alpha-value>` is valid **only** inside the Tailwind config. Anywhere else it
  becomes a literal, broken value — this has already bitten once (an inline SVG
  `fill` ended up holding the placeholder).
- Opacity modifiers on tokens work as expected (`bg-surface-base/85`,
  `bg-accent-violet/10`, `border-accent-violet/40`).
- `text-white` is *semantic ink*, not white: in light mode it resolves to near-black.

### 1.2 Token set

| token | role | dark | light |
|---|---|---|---|
| `surface-base` | page canvas, header | `#0a0a0a` | `#e4e7ee` |
| `surface-alt` | band / tinted section | `#0c0d0d` | `#dadee4` |
| `surface-card` | cards, panels | `#111215` | `#f4f7fc` |
| `surface-card-hover` | card hover, inline `code` | `#15171e` | `#e0e4eb` |
| `surface-raised` | chips, pills, secondary buttons | `#181a23` | `#dee2e9` |
| `border-subtle` | default 1px border | `#21242b` | `#d9dce6` |
| `border-hover` | border on interaction | `#353c4b` | `#b6bdcd` |
| `accent-violet` | primary accent | `#9451ff` | `#7c3aed` |
| `accent-violet-light` | accent text / links | `#cdaffd` | `#6d28d9` |
| `accent-violet-deep` | fills, selection (theme-invariant) | `#6831c0` | `#6831c0` |
| `accent-cyan` | data / tech highlight | `#38bdf8` | `#0369a1` |
| `text-white` | headings | `#f8fafc` | `#0b0e14` |
| `text-main` | body copy | `#e2e8f0` | `#141822` |
| `text-muted` | secondary copy | `#a3aec0` | `#343c4e` |
| `text-dim` | captions, footnotes, footer | `#808d9f` | `#4b5664` |
| `text-on-accent` | ink on an accent fill | `#0a0a0a` | `#f4f7fc` |
| `status-active` | "current" pip only | `#10b981` | `#047857` |
| `code-bg` / `code-fg` | code surfaces | `#08090d` / `#e2e8f0` | `#dde1e7` / `#1b2030` |

The light surfaces are one hue (OKLCH ~260°, C ~0.010) stepped down in small
luminance steps, so band / chip / hover / canvas / card are five distinct planes
rather than five names for the same white. Card is the only near-white surface
and nothing reaches `#ffffff`. Elevation in light mode is *lighter*, so a hover
or a chip darkens from its card; the same classes on dark step lighter. `text-muted`
and `text-dim` step down with the canvas — deepening a canvas without deepening
the ink is what drops captions below their floor.

`text-on-accent` is the one ink that does *not* move with the canvas: it stays at
the card tone in light, because a fill's label must not dim every time the canvas
is retuned. Using `surface-base` for that ink (as the accent-filled buttons did)
coupled the two — retuning the canvas silently cost the label ~0.6:1.

### 1.3 Contrast floor (measured, must not regress)

| content | dark | light |
|---|---|---|
| body text — `text-main` on canvas | 16.1 | 14.3 |
| paragraphs — `text-main`, canvas → card | 15.2 – 16.1 | 14.3 – 16.5 |
| headings — `text-white`, band → card | 17.9 – 18.6 | 14.3 – 18.0 |
| tag chips — `text-muted` on `surface-raised` | 7.7 | 8.5 |
| footer / captions — `text-dim` on canvas | 5.9 | 6.0 |
| footer — `text-dim` on `surface-alt` | 5.8 | 5.5 |
| captions on card — `text-dim` on `surface-card` | 5.6 | 6.9 |
| accent link — `accent-violet-light` on canvas | 10.5 | 5.7 |
| accent marker — `accent-violet` on card | 4.4 | 5.3 |
| inline code — `accent-cyan` on `surface-card-hover` | 8.4 | 4.7 |
| ink on accent fill — `text-on-accent` on `accent-violet` | 4.6 | 5.3 |
| terminal bar — `text-dim` on `surface-alt/60` over card | 5.7 | 6.1 |

`text-dim` used to sit at 4.2 in both themes — below AA. Treat ~5.5:1 as its floor and
`text-muted` ~8:1. If a new surface makes one fail, fix the token, never the one-off.
`surface-base` is the canvas and `surface-alt` the band; the footer rides the band, so
that pair is floored at 5.5 and pins `text-dim` from both sides. `surface-raised` and
`surface-card-hover` are the only surfaces allowed under that floor: chips carry
`text-muted` (8.5) and copy there is `text-main`. The state card's terminal bar is
alpha-composited (`surface-alt/60` over `surface-card`), so it counts as a real
`text-dim` surface whenever the band moves. Two floors bind the canvas from below:
`text-surface-base` on an `accent-violet` fill (4.6) and `accent-cyan` on
`surface-card-hover` (4.7) both sit on AA — a darker canvas has to bring them up,
not down.

### 1.4 Off-limits colour

Brand/identity colours that arrive as data stay as they are: contact `bg_color` values
from the DB (LinkedIn `#0A66C2`, Telegram `#27A7E7`, GitHub `#333333`, Email `#8B53FB`),
the terminal traffic-light dots (`#ff5f57` / `#febc2e` / `#28c840`). Do not
"tokenise" these. `::selection` is unstyled in the repo today — no rule ships.

---

## 2. Typography

- **One family: White Rabbit** — the site's own self-hosted `whiterabbit.woff2`, loaded
  with `next/font/local`. It ships a single weight (400), so semibold/bold are
  synthetic; design around that rather than mixing in a second face.
- Roles are size/tracking/colour, not different fonts: `heading` = headings,
  `body` = prose, `mono` = labels, meta, chips, buttons — all resolving to the same
  family so the "hybrid TUI" reading holds.
- Label convention: uppercase, `tracking-[0.08em]` (controls) to `[0.2em]` (eyebrows),
  `text-[11px]` for the micro tier.
- Scale in use: post detail titles `text-3xl md:text-4xl`, the hero h1
  `text-3xl sm:text-4xl md:text-5xl`; section titles `text-2xl sm:text-3xl`;
  card titles `text-lg`; body `0.95rem` at `1.85` line-height; prose captions
  `0.72rem`. Eyebrows run `tracking-[0.2em]`, controls `tracking-[0.08em]`, the
  micro tier `text-[11px]`; mobile menu rows are `text-3xl`.
- No third-party display faces. Material Symbols exists only in the mockups and must be
  replaced by the repo's `lucide-react` + brand SVGs when ported.

---

## 3. Layout, surfaces, motion
- Containers: `mx-auto px-6` throughout — `max-w-5xl` for the skills grid, the
  post shell and the footer, `max-w-4xl` for hero, career and contacts; prose
  `max-w-3xl`. Page padding `py-24`; the hero opens at `pt-24` (no taller tier)
  and post detail at `pt-12 pb-24 md:pt-24`.
- Hero ground: a transparent matrix-rain canvas behind the untouched hero/about
  content (violet ramp per theme, pixel lead ahead of each drop, magnet-repel
  pointer at 6 cells, disc-ping clicks, steady dim speckle). Padded, feathered
  ellipses measured from the identity/about boxes dim and freeze ambient rain.
  Below 768px, their horizontal radii are capped to leave three live rain lanes
  (42px) per side outside the focus feather. Mobile trails remain visible while
  the center stays calm; desktop focus geometry is unchanged.
  The center-out entrance starts at the visible viewport center on tall mobile
  layouts; its temporary violet highlight is not dimmed by the idle focus zones.
  Pointer displacement and bright click glyphs also remain live in those zones,
  then settle back to the calm bed. Still frame under reduced-motion; idle
  off-screen.
- Hero rendering performance: `HeroMatrix.tsx` caches double-precision focus,
  dither and reveal geometry on layout changes, and distances at click creation.
  `matrixCanvasRenderer.ts` retains native Canvas2D draw packets and repaints
  changed 32-backing-pixel regions, including overlapping glyphs in their
  original order. Buffers are reused; neither DPR, 30Hz cadence, trail density
  nor native glyph rasterization is reduced. Exponential tails are skipped
  only below a proven floating-point/output threshold, not an arbitrary radius.
  Verification compares original/optimized RGBA bytes at fixed clocks in native
  Firefox and Chromium across entrance, pointer/rings, themes, fractional DPR,
  mobile gutters, resizing and column recycling; live scrolling confirms that
  off-screen painting stops.
- **Section header pattern** (used on every section and page): centred title in
  `text-white`, mono subtitle in `accent-violet-light`, then a `40×2px` accent
  rule (`h-0.5 w-10`, `rounded-full`). The subtitle is always real copy from the
  CMS translations, never invented.
  The `01`–`06` index sits in the left column of a `1fr auto 1fr` grid (badge
  right-aligned, `pr-2.5`) with an empty spacer third column, so the badge hangs
  beside the title without pulling the title text off the centre line.
- Bands: hero and about share `bg-surface-alt/50` and read as one block; career and blog
  use full `bg-surface-alt`; portfolio, skills and contacts are transparent.
- Radii: cards and panels `rounded-2xl` (16px), inner media `rounded-xl` (12px),
  buttons `rounded-lg` (8px), chips `rounded` (4px).
- Borders: always 1px `border-subtle`; interaction raises the border to
  `accent-violet/40–/50`, optionally with a tinted shadow. **No image zoom on hover.**
- Motion: `transition-colors` ~300ms; nothing decorative outside the hero
  typewriter. `prefers-reduced-motion` disables smooth scroll and transitions
  (mirrors the repo's existing rule) and also keeps the hero typewriter static.
- **Hero portrait shape** (`hero_section.shape`): `pebble` (default), `square`,
  `rounded` and `squircle`. Every preset is built the same way: the accent plate
  is the full portrait box in the preset's shape (`bg-accent-violet`) and the
  image mask is that same shape inset by `2.15%` of the box, so the accent ring
  stays ~5.6px at 260px in every preset — presets differ in corner treatment
  only, never in size or ring width. `pebble` and `squircle` are `clip-path`
  utilities over an inline `clipPath` in `objectBoundingBox` units
  (`clip-pebble` / `clip-squircle`), so they scale with the portrait at every
  breakpoint; both paths are normalised to fill their box (the squircle is a
  sampled superellipse, `|x|⁴ + |y|⁴ = 1`). `rounded` states its radius as a
  share of the box (`rounded-[15%]`) — a fixed radius read as a square at the
  desktop size. An absent or unknown stored value renders `pebble`.
- **Hero roles** are an ordered list: `hero-section.top.roles.0…` (a numeric index
  map) when the CMS list exists, otherwise the singular `top.role`, which stays
  as the live fallback for copy written before the list — content is never
  migrated behind the editor's back. A single role renders exactly the old lone
  line; several roles stack in the same mono style with `space-y-1`.
- **Hero typewriter** (`hero_section.typewriter` with `typewriter_target` =
  `role1` | `role2` | `all`): only the chosen line types out, holds and erases on
  a loop. It is a leaf client component (`RoleTypewriter`), so the rest of the
  hero stays a server component. The line is always painted complete first, so
  server output, hydration and reduced-motion visitors all read today's static
  markup; the reveal only starts when motion is allowed.

---

## 4. Header and navigation

- Grid `grid-cols-[1fr_auto_1fr]` with **explicit `col-start-1/2/3`**. Hiding the nav on
  mobile otherwise drops it from the flow and the controls slide into the middle column.
- Logo: two source PNGs swapped by theme — `title-ws.png` (1809×320, dark) and
  `title-ws-lightmode.png` (1815×325, light) — both rendered
  `h-6 w-auto max-w-none shrink-0 object-contain` (136×24 at every width),
  **no hover treatment**, linking to the locale home. Both variants are
  CMS-editable per theme via `site_settings.header_logo_dark` /
  `header_logo_light`, and they resolve **per theme**: a row with only one
  variant renders the stored logo for that theme and the bundled asset for the
  other. With neither stored (or no row at all) the markup is byte-identical to
  the bundled-assets version. Every editable value in this section is owned by one
  CMS section — **Layout** — which also holds the résumé PDFs and the footer
  identity; the wording around them is frozen here (§8), so that editor has no
  translation surface at all.
- Nav anchors: the six destinations and the sections' `id=` attributes are
  site-side and not editable. What an editor owns is the *anchor* each link
  points at (`site_settings.nav_anchors`, an ordered `[{ id, anchor }]` array,
  written index-aligned with `header.buttons.N` and read by `id`). `anchor` is
  a fragment-safe element id with no leading `#`; a missing/blank anchor falls
  back to the item id, which reproduces the href this header has always
  rendered. The scroll-spy and the click handler keep reading `item.section`, so
  an edited anchor moves the href without ever breaking in-page navigation or
  the mobile drawer.
- Desktop nav: appears at **`lg`**, centred, mono `text-xs`; active item =
  `text-accent-violet-light font-semibold` + 1px `border-accent-violet` underline.
- Mobile header: logo, theme toggle, hamburger — all right-aligned, 44×44 targets, right
  padding halved (`pr-3`, desktop `pr-6`).
- Mobile menu: fullscreen under the header. It is **portalled to `<body>`** as
  `fixed inset-x-0 top-16 bottom-0` (`z-40`, `lg:hidden`) rather than nested in
  the sticky header, because a `backdrop-filter` element cannot sit inside
  another one; `bg-surface-base/70`, backdrop blur, `overflow-y-auto` and
  safe-area bottom padding; rows are `text-3xl` headings with mono `01`–`06` index
  prefixes and hairline dividers, active row `font-semibold
  text-accent-violet-light`, rows stagger in 40ms apart and the panel closes
  by replaying that cascade **backwards** (footer first, rows last-to-first,
  the panel fading over the tail) so the exit mirrors the entrance;
- Language row + violet-tinted Resume live in a `mt-auto` footer block; body
- scroll lock while open; closes on link tap and Escape; `aria-expanded` /
- `aria-controls` wired, hidden rows `tabIndex={-1}`.
- Scroll-spy: the home page highlights the section currently in view, in both the
  desktop nav and the mobile menu.
- No settings dropdown: it is dropped by design; language and theme stay as inline
  controls. Language switching navigates directly to the canonical target slug
  with `scroll: false`, retaining query parameters and fragments. A one-shot
  scroll handoff preserves the reader's position during the locale commit.
  Portfolio titles/slugs stay English; blog slugs use the target language.
- Theme starts in auto and follows system changes until the visitor saves a
  choice. The blocking first-load script and locale-dependent layout effect
  apply the resolved theme before paint; no idle initialization or forced dark
  default. Explicit light/dark preferences survive locale changes and reloads.
- The bespoke `xs:` / `tablet:` / `mdh:` utilities are retired: standard Tailwind tiers
  cover every case. `SkillsCarousel` and the old `ResumeButton` card went with them,
  replaced by the canon chips and the header's resume action.

---

## 5. Components

### 5.1 Cards (posts and projects)
Poster (4:3-ish, `md:w-72` for blog, `md:w-80` for portfolio, full-bleed), then
body: title (`group-hover` → `accent-violet-light`), description, then chips. The
only floating badge is the view count (eye + real `views`) bottom-right — cards
carry no star badge, `GitHubStars` renders on the post detail page only. The
whole card is a link to `/{locale}/{type}/{id}/{slug}`; no hover zoom.

### 5.2 Chips / tags
`inline-flex items-center gap-1 rounded border border-border-subtle bg-surface-raised
px-2 py-0.5 font-mono text-xs text-text-muted`, with the Tag glyph tinted
`text-accent-violet/70` and a 2px right margin on the glyph. The row keeps one line:
when the chips fit they render once, and only when they overflow does the row become a
seamless marquee (second copy `aria-hidden`, paused on hover/focus, and replaced by
horizontal scroll under `prefers-reduced-motion`).

### 5.3 Career timeline
- One card per **company** (same company = same job, role upgrades grouped): newest role
  featured, older roles nested under a divider with their own title, dates, bullets and
  chips, all aligned to the same left edge (no indent).
- Date pill sits at the **card's top-right**, in the header row next to the logo/company;
  older roles keep an inline pill on their own row.
- Active role wears a `status-active` pip inside the pill.
- The line is drawn **dot-to-dot** per entry (`top-[13px]`, `-bottom-[61px]`, last entry
  none) so it starts at the first dot centre and ends at the last, and shares the dots' x
  axis — the old full-height border overshot 13px above and 261px below.
- Each card links to the company website; the logo is not a separate link.
- Logos: `max-h-10 w-auto object-contain` — constrain height only, so 3:1 marks render
  121×40 instead of being letterboxed into a 40×40 box.

### 5.4 Contacts and the project request form
- Contacts are the four real rows (Email, LinkedIn, GitHub, Telegram) with the DB
  `bg_color` as the tile accent. The résumé is **not** a contact action: the header
  renders it (desktop row and the mobile drawer's pinned block) from
  `hero_section.resume_${locale}`, and the CMS edits both PDFs from its single
  Layout section.
- The request form is **built and live**: a three-step wizard (contact →
  project → details) carrying Name, Email, Company, existing website/repo,
  Project type, Budget range, Desired timeline, "What are you building?", a
  consent checkbox linking the privacy page, and submit. Submit POSTs JSON to
  `/api/requests`, which re-validates every field server-side (length caps,
  `URL` parsing with an http/https scheme allowlist, required consent) and
  writes through the **service-role** client, because `project_requests` holds
  personal data and carries no anon/authenticated grant. Success replaces the
  form with a confirmation; a failure renders the endpoint's stable error code
  in the visitor's own locale. The browser never holds a key.
- Intake is bounded: a hard 8 KB body cap checked before parsing, and a
  per-IP token bucket (3 requests, refilling one every 30 minutes). That
  throttle is per-instance and an abuse/cost bound, not a security control —
  the service-role key staying server-side is.
- Form header block and consent row are **centred, each on its own row**; the
  submit sits right-aligned in the Back / Next row rather than centred.
- The diagonal "Coming soon" band now keys off `REQUEST_INTAKE_ENABLED`, not
  off the production build: unset, intake is **on** everywhere except
  production, where it defaults **off**, the band shows, and the endpoint
  answers 503. Setting the variable to `true` in production makes the band
  disappear and the endpoint accept submissions, so the visitor's view and the
  endpoint's behaviour are always driven by the same flag and can never
  disagree. It is still `aria-hidden` and translucent enough to read the form
  underneath.

### 5.5 Footer
Left: `Made with ❤️ by` + the name **linked to the GitHub profile**, then `Source Code`
linking the repo — both with the violet hover. Right: the VAT value as a copy
affordance carrying `footer.buttonTitle`, then CMS and Privacy Policy links — the three
separated by `//`, the links underlined and hovering to `text-text-muted` (mock at
`code.html`).

Only the **two identity values** behind that chrome are data
(`site_settings.footer_name` / `site_settings.footer_vat_number` — §8). The wording,
the `//` separators and the links themselves stay frozen site copy: a stored name is
still linked to the same GitHub profile, and the GitHub, repo, CMS and privacy hrefs
are site-owned. Each value is nullable and a null *or blank* one renders the literal
this repo shipped with (`Okazakee`, `02863310815`), so an unconfigured row is
byte-identical to the footer before the CMS existed. The VAT is resolved once and
used twice — printed and copied — so a stored value keeps its leading zero; it is
displayed verbatim and never parsed.

### 5.6 Back to top
Fixed bottom-right, inverted fill (`bg-text-main` on `text-surface-base`), `rounded-xl`,
mono label read from `footer.right` (the frozen `Top` string, §8), fades in on scroll and
lifts near the page end.

### 5.7 Code blocks and prose
Fenced code renders with the "Code" header bar and a copy affordance (mirrors
`PreCustom`). Prose: headings `text-white`, body `text-main` (this was the fix — muted
tone was too weak), lists with violet markers, links `accent-violet-light` underlined,
tables as bordered rounded panels with mono uppercase headers, figures with mono
captions and the blurhash as the placeholder background.

---

## 6. Page patterns

- **Home**: hero (with the about card inside it, `#about`) → skills → career →
  portfolio → blog → contacts (+ request form). The six nav anchors are `home`,
  `skills`, `career`, `portfolio`, `blog` and `contacts`; about is part of the
  hero, not a section of its own.
- **List pages**: section header, search field, then cards. The empty
  (`posts-section.no-posts`) and rate-limited (`posts-section.ratelimit`) states
  are designed and implemented in `PostList`.
- **Post detail** (one route, both post types, blocks rendered conditionally):
  - desktop: title → description → tags → poster → meta row (quick links for portfolio,
    author for blog, date, stars, views, share pushed right) → prose.
  - mobile: same down to the poster, meta row shows date/views/share, and the
    conditional blocks move **below** it — portfolio quick links as rows of two
    full-width buttons, blog author as its own row. This mirrors the live page exactly.
  - quick links are resolved by `utils/postButtons.ts`: `resolvePostButtons` reads
    `buttons` when it is non-empty and otherwise falls back to the six legacy link
    columns in the order website, source, demo, store, fdroid, ios — so a row written
    before the column existed renders exactly as it always did. Entries are dropped
    unless the kind is known and `url` is an absolute http(s) URL; a `custom` button
    without a label is dropped too.
  - icons are per-kind and site-owned (globe, GitHub, external link, play, phone,
    Apple, generic link for `custom`); labels come from `i18n/postButtons.ts`, where
    `website` deliberately has none because the globe button has always been
    icon-only. The `data-umami-event` names are per-kind and unchanged from the
    six-column era, so analytics continuity holds; `custom` reports as
    `Custom link button`.
  - JSON-LD `codeRepository` and the `GitHubStars` widget both read the resolved
    `source` button rather than the `source_link` column.
- **Privacy**: numbered sections (`01`, `4.1`) via CSS counters — free, no parser work —
  long-form prose, no table of contents. `Last updated` sits under the title.
- **Error**: terminal-window card, vertically centred in the space between header and
  footer, with retry + home actions.

---

## 7. Responsive canon

- **Standard Tailwind tiers only** (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536).
  The bespoke `xs:` (400–1100px), `tablet:` (768–1279px) and `mdh:` utilities and
  the height-based media queries are **retired**: `tailwind.config.ts` declares no
  custom screens and no `xs:` / `tablet:` / `mdh:` class survives in `src/`.
- Breakpoint decisions: desktop nav at `lg`; cards switch to their horizontal layout at
  `md`; prose stays single-column at every width.
- Mobile specifics: tap targets ≥ 44px, header right padding 12px, logo 136×24, skill
  tiles 96px (three per row), drawer rows 44px, no horizontal overflow at 390.
- The 390 / 768 / 1024 / 1440 checks were done by hand against the mockups; no
  visual-regression test or script in the repo backs them.

---

## 8. Data fidelity rules

Every string and value in the UI comes from the database or an existing translation key.
Invented copy is a defect, not a placeholder. The request form and the Italian nav labels
are the known exceptions still open — listed with the quirks below.

**Sources of truth**

| UI | source |
|---|---|
| all copy | `i18n_translations.translations` (editable namespaces: `hero-section`, `skills-section`, `career-section`, `contacts-section`, `posts-section`, `privacyPolicy`; the privacy body is the `privacy_policy` **column**, not a namespace, and no `request-form` namespace exists yet). `header`, `footer`, `errors` and the `posts-section` chrome are no longer read from here at all — they are frozen site files merged over this object, local winning (§8 quirk list) |
| hero name/about | `hero-section.top.name`, `hero-section.aboutme.*` |
| hero roles | `hero-section.top.roles.0…` when the list exists, else the singular `hero-section.top.role` (kept as the fallback, never migrated) |
| hero portrait/animation | `hero_section.shape` (`pebble` default), `hero_section.typewriter` + `hero_section.typewriter_target` (`role1` \| `role2` \| `all`) |
| skills | `skills_categories` (ordered by `position`) + nested `skills` (`icon` URL, `invert`, optional `link` URL rendered as an external tile anchor, `position` inside its category; `position` NULL sorts last with an id tiebreak) |
| career | `career_entries` (`logo`, `website_url`, `location_*`, `remote`, `startDate`/`endDate`, `description_*`, `skills`) |
| contacts | `contacts` rows (`label`, `link`, `icon`, `bg_color`) |
| posts | `blog_posts` / `portfolio_posts` (`title_en` + `title_${locale}`, `description_*`, `body_*`, `image` + `blurhashURL`, `post_tags`, `views`); project quick links come from `portfolio_posts.buttons` (see §6) |
| post buttons | `portfolio_posts.buttons` — an ordered jsonb array of `{ kind, url, label? }` where `kind` is `website` \| `source` \| `demo` \| `store` \| `fdroid` \| `ios` \| `custom`. Array order IS render order. The label and icon of a preset belong to the site (`src/i18n/messages/postButtons.{en,it}.json` + the icon map in the page), so `label` is only read for `custom`. Null/empty `buttons` falls back to the legacy `source_link` / `demo_link` / `store_link` / `fdroid_link` / `website` / `ios_store_link` columns in that order |
| post button copy | static per-locale messages, NOT `posts-section` translations — these are site invariants, so an editor cannot retitle "Source code" |
| author | `user_profiles` via `author_id` (`display_name`, `avatar_url`) |
| resume | `hero_section.resume_en` / `resume_it` — the columns are unchanged, but the CMS edits them from the Layout section: the résumé left Contacts, which now owns contact rows and its translations only |
| header logos | `site_settings.header_logo_dark` / `header_logo_light` — absolute URLs; NULL falls back to the bundled `title-ws*.png` for that theme, independently per theme |
| nav anchors | `site_settings.nav_anchors` — ordered `[{ id, anchor }]`, written index-aligned with `header.buttons.N`, read by `id`; a missing/blank `anchor` falls back to the item id | |
| footer identity | `site_settings.footer_name` / `footer_vat_number` — nullable `TEXT`: the leading zero of an Italian VAT number is part of the identifier, so it is never numeric, and the value is printed and copied verbatim, never parsed. Null or blank renders this repo's literals (`Okazakee`, `02863310815`) |

**Custom formatting to honour**

- `****text****` → violet-tinted `<label>` (`formatLabels`) — hero name/role, the about
  paragraph and section subtitles. Only words the DB actually wraps are tinted.
- `post_tags` is a quoted list (`["Docker","Bun"]`) parsed by regex; unquoted fragments
  (e.g. a stray `Tags` token in one row) are ignored.
- Markdown images use `![caption-blurhash](url)`: the caption before the first `-`, the
  remainder as the blur placeholder; images open in the lightbox with a "Click to view"
  hint.
- Code fences → the "Code" block with copy; markdown tables render as panels.

**Known quirks** found while porting:

- Fixed: `GitHubStars` now ignores profile/organisation links (`source_link` for
  MinePanel is an org URL, which used to fetch a repo that 404s and render ★ 0).
- Fixed: the dev-mode instant validation used to log `Could not validate 'instant' …`
  for every 404 path, because unknown single-segment paths land on `/[post_type]`
  (and unknown posts on `/[post_type]/[id]/[title]`) and call `notFound()`. Both
  segments now set `instant = false` — the pages are cached and still navigate
  instantly, the flag only opts out of the validation feedback.
- Unverified: the 404 routes are said to answer **HTTP 200** (soft 404), which predates the redesign. Nothing in the source sets a status; confirm against a running server before relying on it.
- Fixed: language switches after a hard refresh no longer recreate the theme
  `<script>` in React's client render path. `Providers` registers the inline
  bootstrap with `useServerInsertedHTML`, with a per-instance guard against
  repeated stream flushes. Next inserts it into the initial `<head>` stream,
  so the saved or system theme is applied before body content paints,
  independently of hydration.
  The locale-keyed layout effect still restores the theme on navigation.
  `[locale]` remains the root layout; no extra layout or theme dependency is
  needed. The obsolete external bootstrap and its Biome exclusion were removed.
- Fixed: `sitemap.ts` slugged posts differently from the card link helper. Both
  now share `getPostHref` from `src/utils/postHref.ts`, and `next.config.ts`
  answers the legacy wrong-slug URLs with a permanent 308.
- Partly fixed: `RequestForm.tsx` no longer holds a hardcoded English `copy`
  object — its copy (labels, options, step titles, consent sentence, success
  and error messages) is static per-locale data in
  `src/i18n/messages/requestForm.{en,it}.json`, read through
  `src/i18n/requestForm.ts`, like the post-button labels. Like those, it is a
  **site invariant** and deliberately NOT CMS-editable: an editor must not be
  able to retitle a validation message. The option VALUES are storage, not
  copy, and stay identical in both locales.
- Frozen: `errors`, `header`, `footer` and the `posts-section` chrome (post
  link labels, empty states, search placeholder, copy-to-clipboard feedback) are
  no longer CMS-editable. They are **site invariants**: an editor retitling
  "Page not found" or reordering the nav breaks the product, not the words.
  They live in `src/i18n/messages/site.{en,it}.json` and are merged over the
  database by `src/i18n/siteCopy.ts`, one namespace deep, **local winning** —
  so a stale row can never shadow a frozen key. Same rule and same shape as
  `requestForm` and `postButtons`.
- Staging-only: `site_settings` and the two footer identity columns live in
  `dev_staging`, so a `public` build keeps rendering the footer's shipped
  defaults. `getSiteSettings` therefore selects `*` rather than naming the
  footer columns — a database that never ran
  `20261005145655_add_site_settings_footer_identity.sql` (dev_staging-qualified,
  nullable columns, no backfill) must keep serving the header — and it
  normalises blank to null so the footer falls back instead of rendering a gap.
  `public` is untouched until that file is deliberately promoted; nothing here
  asserts it has been.
- `header.buttons` is index-aligned with `navAnchors` and must hold one order in
  both locales. The stored Italian array had Career and Portfolio transposed,
  which is what the hardcoded `italianLabels` array in `NavMenu` existed to
  paper over. Both the array and the transcription are gone; the pair is now
  only ever edited together, in one file.
- Still open: the drawer's `Toggle menu` aria-label and the post page's
  share-tooltip strings are literals.

**Writing CMS copy:** read the current `translations` object, merge the change and patch
it back. Patching from an older snapshot silently reverts whatever was added in between —
that already cost the `request-form` namespace and the `Top` label once.

**New copy that still needs i18n keys.** `header.language` is frozen in the site
copy and wired in both navs; nothing is English-only in the drawer any more.

---

## 9. Accessibility

Contrast floors per §1.3; 44px minimum tap targets; visible focus states via the accent
border; `aria-expanded`/`aria-controls` on the drawer toggle and `aria-label` on icon
buttons; Escape closes the drawer; body scroll locked while it is open; decorative
overlays marked `aria-hidden`; `prefers-reduced-motion` honoured.

---

## 10. What is mock-only

The mockups are HTML files: Tailwind Play CDN with an inline config, Material Symbols,
Google-hosted fonts, inline scripts and static data. In the repo the equivalents are the
JS Tailwind config, `lucide-react` + brand SVGs, `next/font/local`, client components and
DB reads. Nothing from the mocks' plumbing ships — only their structure, tokens and
behaviour.

Still undesigned: nothing structural. The lightbox (`ImageModal`), share (`ShareButton`),
view counter (`ViewDisplay` plus the `incrementViews` action), the search empty and
rate-limited states, and the blur-up placeholders are all built. What remains is the §8
defect list — shipped copy that still has to move to the CMS.
