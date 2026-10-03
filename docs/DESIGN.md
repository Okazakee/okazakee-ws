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
| `surface-base` | page canvas | `#0a0a0a` | `#ebeff6` |
| `surface-alt` | band / tinted section | `#0c0d0d` | `#e4e8ef` |
| `surface-card` | cards, panels | `#111215` | `#f6f9fe` |
| `surface-card-hover` | card hover, inline `code` | `#15171e` | `#e8ecf3` |
| `surface-raised` | chips, pills, inset rows | `#181a23` | `#e6eaf1` |
| `border-subtle` | default 1px border | `#21242b` | `#d9dce6` |
| `border-hover` | border on interaction | `#353c4b` | `#b6bdcd` |
| `accent-violet` | primary accent | `#9451ff` | `#7c3aed` |
| `accent-violet-light` | accent text / links | `#cdaffd` | `#6d28d9` |
| `accent-violet-deep` | fills, selection | `#7f3bed` | `#6831c0` |
| `accent-cyan` | data / tech highlight | `#38bdf8` | `#0369a1` |
| `text-white` | headings | `#f8fafc` | `#0b0e14` |
| `text-main` | body copy | `#e2e8f0` | `#141822` |
| `text-muted` | secondary copy | `#a3aec0` | `#3a4254` |
| `text-dim` | captions, footnotes, footer | `#808d9f` | `#55606f` |
| `status-active` | "current" pip only | `#10b981` | `#047857` |
| `code-bg` / `code-fg` | code surfaces | `#08090d` / `#e2e8f0` | `#ecf0f7` / `#1b2030` |

The light surfaces are one hue (OKLCH ~260°, C 0.010) stepped down by a few
points of luminance each — canvas, band, chip, card are distinct planes, not
four names for the same white. Elevation in light mode is *lighter*, so a
hover or a chip darkens from its card; the same classes on dark steps lighter.
Cards never reach `#ffffff`: pure white against a tinted canvas is what made
the light theme read as a blank sheet.

### 1.3 Contrast floor (measured, must not regress)

| content | dark | light |
|---|---|---|
| body text — `text-main` on canvas | 16.1 | 15.4 |
| paragraphs — `text-main`, canvas → card | 15.2 – 16.1 | 15.4 – 16.8 |
| headings — `text-white`, band → card | 17.9 – 18.6 | 15.9 – 18.3 |
| tag chips — `text-muted` on `surface-raised` | 7.7 | 8.3 |
| footer / captions — `text-dim` on canvas | 5.9 | 5.5 |
| captions on card — `text-dim` on `surface-card` | 5.6 | 6.1 |
| accent link — `accent-violet-light` on canvas | 10.5 | 6.2 |
| accent marker — `accent-violet` on band | 4.5 | 4.7 |
| inline code — `accent-cyan` on `surface-card-hover` | 8.4 | 5.0 |
| ink on accent fill — `surface-base` on `accent-violet` | 4.6 | 4.9 |

`text-dim` used to sit at 4.2 in both themes — below AA. Treat ~5.5:1 as its floor and
`text-muted` ~8:1. If a new surface makes one fail, fix the token, never the one-off.
That floor pins the light canvas: `surface-base` is the deepest tone `text-dim` may sit
on, and `surface-alt` / `surface-raised` / `surface-card-hover` may go below it only
because nothing renders `text-dim` there — chips carry `text-muted` (8.1+), and copy on
those surfaces is `text-main`. If `text-dim` ever lands on a band, deepen that token
first.

### 1.4 Off-limits colour

Brand/identity colours that arrive as data stay as they are: contact `bg_color` values
from the DB (LinkedIn `#0A66C2`, Telegram `#27A7E7`, GitHub `#333333`, Email `#8B53FB`),
the terminal traffic-light dots (`#ff5f57` / `#febc2e` / `#28c840`) and `::selection`
(`accent-violet-deep` on white). Do not "tokenise" these.

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
- Scale in use: post/page titles `text-3xl md:text-4xl`; section titles
  `text-2xl sm:text-3xl`; card titles `text-xl`; drawer role titles `text-base`;
  body `0.95rem` at `1.85` line-height; prose captions `0.72rem`.
- No third-party display faces. Material Symbols exists only in the mockups and must be
  replaced by the repo's `lucide-react` + brand SVGs when ported.

---

## 3. Layout, surfaces, motion
- Containers: sections `max-w-5xl mx-auto px-6`; prose `max-w-3xl`; page padding
  `py-24`, hero `pt-24 md:pt-36`.
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
  `text-white`, mono subtitle in `accent-violet-light`, then a `40×1px` accent rule.
  The subtitle is always real copy from the CMS translations, never invented.
- Bands: hero and about share `bg-surface-alt/50` and read as one block; career and blog
  use full `bg-surface-alt`; portfolio, skills and contacts are transparent.
- Radii: cards and panels `rounded-2xl` (16px), inner media `rounded-xl` (12px),
  buttons `rounded-lg` (8px), chips `rounded` (4px).
- Borders: always 1px `border-subtle`; interaction raises the border to
  `accent-violet/40–/50`, optionally with a tinted shadow. **No image zoom on hover.**
- Motion: `transition-colors` ~300ms; nothing decorative. `prefers-reduced-motion`
  disables smooth scroll and transitions (mirrors the repo's existing rule).

---

## 4. Header and navigation

- Grid `grid-cols-[1fr_auto_1fr]` with **explicit `col-start-1/2/3`**. Hiding the nav on
  mobile otherwise drops it from the flow and the controls slide into the middle column.
- Logo: 1809×320 asset, `h-6 w-auto max-w-none shrink-0 object-contain` (136×24 at every
  width), **no hover treatment**, links to the locale home.
- Desktop nav: appears at **`lg`**, centred, mono `text-xs`; active item =
  `text-accent-violet-light font-semibold` + 1px `border-accent-violet` underline.
- Mobile header: logo, theme toggle, hamburger — all right-aligned, 44×44 targets, right
  padding halved (`pr-3`, desktop `pr-6`).
- Mobile menu: fullscreen under the header (`absolute inset-x-0 top-full` in the
- sticky header, `h-[calc(100dvh-4rem)]`, `bg-surface-base/[0.98]`, backdrop
- blur, `overflow-y-auto`, safe-area bottom padding); rows are `text-3xl`
- headings with mono `01`–`06` index prefixes and hairline dividers, active row
- `font-semibold text-accent-violet-light`, rows stagger in 40ms apart;
- Language row + violet-tinted Resume live in a `mt-auto` footer block; body
- scroll lock while open; closes on link tap and Escape; `aria-expanded` /
- `aria-controls` wired, hidden rows `tabIndex={-1}`.
- Scroll-spy: the home page highlights the section currently in view, in both the
  desktop nav and the mobile menu.
- No settings dropdown: it is dropped by design; language and theme stay as inline
  controls. The language switch is a client navigation with `scroll: false`, so it
  swaps the locale in place and keeps the reader at the same scroll position
  instead of hard-reloading.
- The bespoke `xs:` / `tablet:` / `mdh:` utilities are retired: standard Tailwind tiers
  cover every case. `SkillsCarousel` and the old `ResumeButton` card went with them,
  replaced by the canon chips and the header's resume action.

---

## 5. Components

### 5.1 Cards (posts and projects)
Poster (4:3-ish, `md:w-72`/`md:w-80`, full-bleed), then body: title (`group-hover` →
`accent-violet-light`), 2–3 line description, then chips. Floating badges: view count
(eye + real `views`) bottom-right; star count only where a public repo exists. The whole
card is a link to `/{locale}/{type}/{id}/{slug}`; no hover zoom.

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
  `bg_color` as the tile accent, plus the resume action from `hero_section.resume_en`.
- The request form is mock-only for now and will be built on `precall` (a library where
  the consumer owns the form and each field carries policy metadata such as
  `sendToAI`; email is the obvious not-to-AI field). Fields: Name, Email, Company,
  existing website/repo, Project type, Budget range, Desired timeline, "What are you
  building?", consent checkbox linking the privacy page, submit.
- Form header block, consent row and submit button are **centred, each on its own row**.
- A diagonal "Coming soon!" band overlays the card, translucent enough to read the form
  and applied with `aria-hidden`.

### 5.5 Footer
Left: `Made with ❤️ by` + the name **linked to the GitHub profile**, then `Source Code`
linking the repo — both with the violet hover. Right: the VAT value as a copy
affordance carrying `footer.buttonTitle`, then CMS and Privacy Policy links — the three
separated by bullets, the links underlined and hovering to `text-text-muted` (mock at
`code.html`).

### 5.6 Back to top
Fixed bottom-right, inverted fill (`bg-text-main` on `text-surface-base`), `rounded-xl`,
mono `Top` label (kept for clarity over the live "Go back up"), fades in on scroll and
lifts near the page end.

### 5.7 Code blocks and prose
Fenced code renders with the "Code" header bar and a copy affordance (mirrors
`PreCustom`). Prose: headings `text-white`, body `text-main` (this was the fix — muted
tone was too weak), lists with violet markers, links `accent-violet-light` underlined,
tables as bordered rounded panels with mono uppercase headers, figures with mono
captions and the blurhash as the placeholder background.

---

## 6. Page patterns

- **Home**: hero → about → skills → career → portfolio → blog → contacts (+ request
  form). Nav anchors map to these.
- **List pages**: section header, search field, then cards. Search states (empty,
  rate-limited) still need designing.
- **Post detail** (one route, both post types, blocks rendered conditionally):
  - desktop: title → description → tags → poster → meta row (quick links for portfolio,
    author for blog, date, stars, views, share pushed right) → prose.
  - mobile: same down to the poster, meta row shows date/views/share, and the
    conditional blocks move **below** it — portfolio quick links as rows of two
    full-width buttons, blog author as its own row. This mirrors the live page exactly.
- **Privacy**: numbered sections (`01`, `4.1`) via CSS counters — free, no parser work —
  long-form prose, no table of contents. `Last updated` sits under the title.
- **Error**: terminal-window card, vertically centred in the space between header and
  footer, with retry + home actions.

---

## 7. Responsive canon

- **Standard Tailwind tiers only** (sm 640 / md 768 / lg 1024 / xl 1280 / 2xl 1536).
  The repo's bespoke `xs:` (400–1100px) and `tablet:` (768–1279px) utilities and the
  height-based media queries are **retired** — they existed to paper over edge cases the
  redesign removes. Porting therefore means remapping ~22 `xs:`/`tablet:` usages onto the
  standard tiers.
- Breakpoint decisions: desktop nav at `lg`; cards switch to their horizontal layout at
  `md`; prose stays single-column at every width.
- Mobile specifics: tap targets ≥ 44px, header right padding 12px, logo 136×24, skill
  tiles 96px (three per row), drawer rows 44px, no horizontal overflow at 390.
- Verified clean at 390 / 768 / 1024 / 1440 in both themes.

---

## 8. Data fidelity rules

Every string and value in the UI comes from the database or an existing translation key.
Invented copy is a defect, not a placeholder.

**Sources of truth**

| UI | source |
|---|---|
| all copy | `i18n_translations.translations` (namespaces: `header`, `hero-section`, `skills-section`, `career-section`, `contacts-section`, `posts-section`, `footer`, `privacyPolicy`, `request-form`, `errors`) |
| hero name/role/about | `hero-section.top.*`, `hero-section.aboutme.*` |
| skills | `skills_categories` + nested `skills` (`icon` URL, `invert`) |
| career | `career_entries` (`logo`, `website_url`, `location_*`, `remote`, `startDate`/`endDate`, `description_*`, `skills`) |
| contacts | `contacts` rows (`label`, `link`, `icon`, `bg_color`) |
| posts | `blog_posts` / `portfolio_posts` (`title_en` + `title_${locale}`, `description_*`, `body_*`, `image` + `blurhashURL`, `post_tags`, `views`, optional `source_link` / `demo_link` / `store_link` / `fdroid_link` / `website` / `ios_store_link`) |
| author | `user_profiles` via `author_id` (`display_name`, `avatar_url`) |
| resume | `hero_section.resume_en` / `resume_it` |

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
- Open: the 404 routes answer **HTTP 200** (soft 404), which predates the redesign.
- Dev-only: React logs `Encountered a script tag …` when a client-side language switch
  re-renders the `[locale]` layout, because the blocking theme-init script lives there.
  It must stay inline to apply the stored theme before first paint (a
  `beforeInteractive` Script lost that guarantee), so the warning is accepted.
- Open: `sitemap.ts` slugs posts differently from the card link helper, so it advertises
  `/blog/12/dear-mom...` while the card links `/blog/12/dear-mom`.

**Writing CMS copy:** read the current `translations` object, merge the change and patch
it back. Patching from an older snapshot silently reverts whatever was added in between —
that already cost the `request-form` namespace and the `Top` label once.

**New copy that will need i18n keys** when the request form and drawer land: the form
labels and options, `Project request` / `Send me a request` / `Send request`, the consent
sentence, and the drawer's `Language` label (`header.language` already exists).

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

Still undesigned: search result states, the blog list page mock, detail-page
  interactions (lightbox, share, view increment) and blur-up placeholder states.
