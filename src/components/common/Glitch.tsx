'use client';

import type { ReactNode } from 'react';
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
  trigger?: GlitchTrigger;
}

/**
 * Glitch (docs/DESIGN.md §3): plays a PowerGlitch burst — ported from
 * react-powerglitch (MIT, github.com/7PH/react-powerglitch) — over the element
 * it wraps, then stops.
 *
 * `mode` picks the triggers, and the two presets are the same speed and size —
 * fast and small on purpose, since this sits on content a reader is using.
 * The canon is the tear: four slice layers, each a 2–10% band torn sideways by
 * up to 12%, a 4% shake and the intensity ramped in and out, all over a 150 ms
 * loop. The other is the flicker, a different effect rather than a louder one:
 * three broad bands (12–30%) that stay in place and rotate their hue within
 * ±90° while the element takes a short vertical nudge, same 150 ms. **Hover**
 * plays the tear unless the surface asks for `hoverPreset="click"` (the cards
 * and contact tiles do, because a sideways tear reads as a broken layout at
 * their size); a **click** always plays the flicker; `both` wires both and
 * cancels hover on leave. Every mode is one shot.
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
  trigger = 'self',
}: GlitchProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useGlitch(containerRef, { active, hoverPreset, mode, trigger });

  return (
    <span className={`glitch ${className}`.trim()} ref={containerRef}>
      {children}
    </span>
  );
}
