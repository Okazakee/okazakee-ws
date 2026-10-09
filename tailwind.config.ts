import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'selector',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // Two backdrop blurs for the site's translucent surfaces: the sticky
      // header, the mobile drawer, the image-modal overlay, a post card's
      // badge and the request band's overlay all use `backdrop-blur-surface`,
      // while the mobile header and nav drawer pair uses the stronger
      // `backdrop-blur-mobile` (docs/DESIGN.md §3). Per-element blur values
      // are not used.
      backdropBlur: {
        surface: '3px',
        mobile: '5px',
      },
      // The cursor kinds resolve to the ported "Blue" art in globals.css, so
      // every `cursor-*` class in the codebase (and the `@apply`s in the base
      // layer) uses it without a sweep. Kinds the scheme has no art for
      // (`cursor-grab`, `zoom-in`, …) stay the system cursors.
      cursor: {
        default: 'var(--cursor-default)',
        pointer: 'var(--cursor-pointer)',
        text: 'var(--cursor-text)',
        'not-allowed': 'var(--cursor-not-allowed)',
        wait: 'var(--cursor-wait)',
        progress: 'var(--cursor-progress)',
        crosshair: 'var(--cursor-crosshair)',
        help: 'var(--cursor-help)',
        move: 'var(--cursor-move)',
        'ew-resize': 'var(--cursor-ew-resize)',
        'ns-resize': 'var(--cursor-ns-resize)',
        'nwse-resize': 'var(--cursor-nwse-resize)',
        'nesw-resize': 'var(--cursor-nesw-resize)',
        copy: 'var(--cursor-copy)',
      },
      fontFamily: {
        whiterabt: 'var(--font-whiterabt)',
        body: 'var(--font-whiterabt)',
        heading: 'var(--font-whiterabt)',
        mono: 'var(--font-whiterabt)',
      },
      colors: {
        // Redesign canon (docs/DESIGN.md §1). Values live in globals.css as
        // --c-* custom properties, one palette per theme; Tailwind v4 applies
        // opacity modifiers with color-mix, so `bg-surface-card/85` works.
        'surface-base': 'var(--c-surface-base)',
        'surface-alt': 'var(--c-surface-alt)',
        'surface-card': 'var(--c-surface-card)',
        'surface-card-hover': 'var(--c-surface-card-hover)',
        'surface-raised': 'var(--c-surface-raised)',
        'border-subtle': 'var(--c-border-subtle)',
        'border-hover': 'var(--c-border-hover)',
        'accent-violet': 'var(--c-accent-violet)',
        'accent-violet-light': 'var(--c-accent-violet-light)',
        'accent-violet-deep': 'var(--c-accent-violet-deep)',
        'accent-cyan': 'var(--c-accent-cyan)',
        'text-white': 'var(--c-text-white)',
        'text-main': 'var(--c-text-main)',
        'text-muted': 'var(--c-text-muted)',
        'text-dim': 'var(--c-text-dim)',
        'text-on-accent': 'var(--c-text-on-accent)',
        'status-active': 'var(--c-status-active)',
        'code-bg': 'var(--c-code-bg)',
        'code-fg': 'var(--c-code-fg)',
      },
    },
  },
};

export default config;
