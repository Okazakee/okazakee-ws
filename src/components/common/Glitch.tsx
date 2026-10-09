'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useRef } from 'react';
import type { GlitchMode, GlitchPreset } from '@/libs/glitch/layers';
import { type GlitchTrigger, useGlitch } from '@/libs/glitch/useGlitch';

interface GlitchProps {
  /**
   * Burst when this flips to `true`: for a state change that is not a pointer
   * event, like the scroll-spy moving the nav highlight (pass the item's own
   * active state). Nothing plays on mount.
   */
  active?: boolean;
  /** The element to glitch: one element, the box the slices are cut from. */
  children: ReactNode;
  /** Classes for the layer container — never for the glitched element. */
  className?: string;
  /**
   * Preset the **hover** trigger plays. It is the canon tear by default; pass
   * `"click"` for a surface that should flicker on hover instead, which is what
   * the cards and the contact tiles do. A click always plays the click preset.
   */
  hoverPreset?: GlitchPreset;
  mode: GlitchMode;
  style?: CSSProperties;
  trigger?: GlitchTrigger;
}

/**
 * Glitch (docs/DESIGN.md §3): plays a PowerGlitch burst — ported from
 * react-powerglitch (MIT, github.com/7PH/react-powerglitch) — over the element
 * it wraps, then stops.
 *
 * `mode` picks the triggers. The hover and click presets share a 150 ms
 * duration: the canon tear uses four 2–10% bands torn sideways by up to 12%,
 * with 4% shake; the flicker uses three 12–30% bands with ±90° hue and a short
 * vertical nudge. The back-to-top wraps the button itself and uses the same
 * hover tear as the profile portrait. A **click** always plays the click
 * preset; `both` wires both and cancels hover on leave. Every mode is one shot.
 *
 * The wrapped element keeps its own styles: the burst plays on clones the hook
 * stacks inside this container's grid cell (`globals.css`), so the box itself
 * is never shadowed, filtered or moved. Wrap the *content* of a box — the tiles,
 * cards and contact tiles all keep their frame and hand their row layout to the
 * glitched element — and the burst is generated against that content's own size
 * (`clampGlitchToBox` caps travel at 36 px and shake at 12 / 6 px), so a wide
 * card glitches as slightly as a small tile.
 *
 * Give a host that is bigger than its content (`group`) `trigger="group"`, or
 * the burst stays inside the content box: a padded tile would only glitch where
 * its content is, not from its whole box.
 */
export function Glitch({
  active = false,
  children,
  className = '',
  hoverPreset = 'hover',
  mode,
  style,
  trigger = 'self',
}: GlitchProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useGlitch(containerRef, { active, hoverPreset, mode, trigger });

  return (
    <span className={`glitch ${className}`.trim()} ref={containerRef} style={style}>
      {children}
    </span>
  );
}
