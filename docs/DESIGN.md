---
name: Cyber Midnight Dev
colors:
  surface: '#12131a'
  surface-dim: '#12131a'
  surface-bright: '#383941'
  surface-container-lowest: '#0d0e15'
  surface-container-low: '#1a1b22'
  surface-container: '#1e1f27'
  surface-container-high: '#292931'
  surface-container-highest: '#34343c'
  on-surface: '#e3e1ec'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#e3e1ec'
  inverse-on-surface: '#2f3038'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#fbabff'
  on-secondary: '#580065'
  secondary-container: '#ae05c6'
  on-secondary-container: '#ffd8fd'
  tertiary: '#4cd7f6'
  on-tertiary: '#003640'
  tertiary-container: '#009eb9'
  on-tertiary-container: '#002f38'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#ffd6fd'
  secondary-fixed-dim: '#fbabff'
  on-secondary-fixed: '#36003e'
  on-secondary-fixed-variant: '#7c008e'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#12131a'
  on-background: '#e3e1ec'
  surface-variant: '#34343c'
typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.03em
  display-mobile:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-md:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-md: 1.5rem
  margin: 1rem
  margin-md: 2rem
  margin-lg: 3rem
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
  space-2xl: 3rem
---

## Brand & Style

This design system channels a high-performance developer workstation aesthetic infused with a nostalgic, digital-dusk aura derived from 16-bit pixel illustration. It bridges technical precision with atmospheric retro-futurism—evoking late-night terminal sessions, glowing skyline silhouettes, and tactical street-tech sensibilities.

The visual style merges **Minimalist Developer Utility** with **Cyberpunk Ambient Glow**:
- **Target Audience:** Modern software engineers, devops specialists, creative technologists, and digital artisans who value density, razor-sharp hierarchy, and visual polish without gimmicks.
- **Atmosphere & Tone:** Focused, midnight-tuned, cerebral, and subtly electrifying. High functional clarity balances against neon magenta backlights, cyan edge flares, and velvety deep-indigo base surfaces.
- **Principles:**
  - *Engineered Density:* High information throughput, restrained padding, crisp monospaced cues, and zero visual clutter.
  - *Chromatic Precision:* Controlled bursts of electric violet, dusk magenta, and tactical cyan strictly reserved for active states, syntax tokens, and interactive focal points.
  - *Structural Restraint:* Subtle 1px borders, muted dithered surfaces, and sharp geometric framing replace heavy drop shadows and rounded plastic forms.

## Colors

The palette takes inspiration directly from the midnight skyline, electric dusk clouds, and rim-lit character contours of the reference artwork:

- **Primary Accent (`#8B5CF6` — Electric Violet):** The principal operational signal. Used for primary call-to-actions, active navigation highlights, focus rings, and primary data traces.
- **Secondary Accent (`#D946EF` — Dusk Magenta):** Derived from the vibrant retro dusk clouds. Serves as a high-visibility alert, destructive confirmation accent, critical notification glow, and secondary metric highlight.
- **Tertiary Accent (`#06B6D4` — Cyan Rim Light):** Extracted from the shoulder rim lights and crisp glasses reflections. Deployed for terminal outputs, status badges (running, active, online), syntax keys, and telemetry readouts.
- **Neutral Core (`#0D0E15` — Midnight Obsidian):** The foundational canvas layer. Extended via surface tonal stepping:
  - Canvas / Background: `#0A0B10`
  - Surface Base: `#0D0E15`
  - Surface Elevated / Card: `#131520`
  - Surface Highlight / Input: `#1A1D2D`
  - Subtle Borders / Gridlines: `#23273B`
  - Text Primary: `#F3F4F6`
  - Text Muted / Dithered Slate: `#94A3B8`
  - Text Subdued: `#4B5563`

## Typography

The type system blends the angular, mechanical charm of **Space Grotesk** with the neutral, hyper-legible utility of **Inter**:

- **Headlines & Display (Space Grotesk):** Features idiosyncratic geometric cuts that mirror pixel grids and retro-cyber software interfaces without resorting to illegible novelty fonts. Tight tracking applied across all heading scales maintains a condensed, dense dashboard feel.
- **Body & Data Text (Inter):** Maximizes readability in compact multi-column views, tables, logs, and configuration matrices.
- **Labels & Metas (Space Grotesk Uppercase):** All `label-sm` and `label-md` variants employ slight uppercase styling and open tracking (`0.05em`–`0.08em`) to mirror tactical telemetry tags, status badges, and tab headers.

## Layout & Spacing

A compact, 4px/8px incremental spacing rhythm engineered for complex, high-utility developer surfaces:

- **Grid Strategy:** 12-column responsive fluid grid pinned to a maximum canvas constraint of `1440px`.
  - *Mobile (< 640px):* 4-column layout, `1rem` outer margin, `0.75rem` gutters.
  - *Tablet (640px – 1024px):* 8-column layout, `1.5rem` outer margin, `1rem` gutters.
  - *Desktop (> 1024px):* 12-column layout, `2rem` to `3rem` margins, `1.5rem` gutters.
- **Rhythm & Structure:** Dense component padding keeps information scan rates high. Multi-pane panels, toolbars, and inspection sidebars collapse cleanly along modular vertical dividers.

## Elevation & Depth

Visual depth avoids muddy, diffuse drop shadows, opting instead for **tactile tonal layering**, **subtle wireframe borders**, and **localized neon rim lighting**:

- **Base Layer (L0):** `#0A0B10` — The bedrock workstation canvas.
- **Layer 1 (L1 - Panels & Containers):** `#0D0E15` with a 1px perimeter border rendered in `rgba(148, 163, 184, 0.12)`.
- **Layer 2 (L2 - Cards, Popovers & Floating Drawers):** `#131520` with a 1px border in `rgba(139, 92, 246, 0.25)` and a micro-glow `0 4px 20px -2px rgba(10, 11, 16, 0.8)`.
- **Layer 3 (L3 - Active Focal / Modal Modifiers):** `#1A1D2D` accentuated by a subtle top-edge rim line (`1px solid rgba(139, 92, 246, 0.5)`) and a tight accent back-glow (`0 0 16px -2px rgba(139, 92, 246, 0.15)`).
- **Glass & Blur:** Select floating overlays (contextual command palettes, toolbars) apply `backdrop-filter: blur(12px)` over an 85% opacity surface.

## Shapes

The geometric personality is sharp and architectural:

- **Scale Option: `1` (Soft):**
  - Standard components (buttons, input fields, badges, tabs): `4px` (`0.25rem`).
  - Surface cards, dialog panels, code windows: `8px` (`0.5rem`).
  - Floating utility modals & popovers: `12px` (`0.75rem`).
- **Corner Philosophy:** Elements deliberately avoid large pill shapes and circular motifs (with the exception of user avatars and status pips) to preserve the utilitarian, hardware-inspired dev-tool posture.

## Components

### Buttons
- **Primary:** Background `#8B5CF6`, text `#FFFFFF`, border `1px solid rgba(255, 255, 255, 0.15)`. On hover, subtle outer luminescence `0 0 12px rgba(139, 92, 246, 0.45)`.
- **Secondary / Outline:** Background `rgba(19, 21, 32, 0.6)`, text `#F3F4F6`, border `1px solid #23273B`. On hover, border transitions to `#8B5CF6` with text `#8B5CF6`.
- **Ghost:** Transparent background, muted text `#94A3B8`. Hover fills with `rgba(139, 92, 246, 0.1)` and text `#F3F4F6`.
- **Destructive:** Border `1px solid rgba(217, 70, 239, 0.4)`, background `rgba(217, 70, 239, 0.12)`, text `#D946EF`. Hover triggers `0 0 12px rgba(217, 70, 239, 0.3)`.

### Inputs & Selects
- Dark embedded field `#0A0B10` with crisp `1px solid #23273B` border.
- Placeholder text in subdued slate (`#4B5563`).
- Active focus invokes a sharp `1px solid #8B5CF6` outline accompanied by a faint `0 0 0 3px rgba(139, 92, 246, 0.15)` tactical focus ring.

### Cards & Panels
- Framed in `#131520` with a standard `1px solid #23273B` outline.
- Header bars within cards can feature an optional subtle gradient underline transitioning from `#8B5CF6` to transparent or a 1px divider in `rgba(255, 255, 255, 0.06)`.

### Chips & Badges
- **Status Online / Success:** Background `rgba(6, 182, 212, 0.12)`, text `#06B6D4`, border `1px solid rgba(6, 182, 212, 0.3)`.
- **Warning / Activity:** Background `rgba(217, 70, 239, 0.12)`, text `#D946EF`, border `1px solid rgba(217, 70, 239, 0.3)`.
- **Tag / Category:** Background `#1A1D2D`, text `#94A3B8`, border `1px solid #23273B`. Uppercase `label-sm` Space Grotesk typography.

### Checkboxes & Radios
- Box size `16x16px` with `2px` roundedness. Border `1px solid #4B5563`, background `#0A0B10`.
- Checked state: Background `#8B5CF6`, border `#8B5CF6` with a high-contrast white glyph.

### Workstation Code Blocks & Terminals
- Background `#08090D` with header toolbar in `#0D0E15`.
- 1px outer border `#1E2235`.
- Monospace output colored in cyan (`#06B6D4`), violet (`#8B5CF6`), and magenta (`#D946EF`) syntax tokens over a quiet slate base.