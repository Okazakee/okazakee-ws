'use client';

import type { ReactNode } from 'react';
import { useRef } from 'react';
import type { GlitchMode } from '@/libs/glitch/layers';
import { type GlitchTrigger, useGlitch } from '@/libs/glitch/useGlitch';

interface GlitchProps {
  /** The element to glitch: one element, the box the slices are cut from. */
  children: ReactNode;
  /** Classes for the layer container — never for the glitched element. */
  className?: string;
  mode: GlitchMode;
  trigger?: GlitchTrigger;
}

/**
 * Glitch (docs/DESIGN.md §3): plays a PowerGlitch burst — ported from
 * react-powerglitch (MIT, github.com/7PH/react-powerglitch) — over the element
 * it wraps, then stops.
 *
 * `mode` picks the ported behaviour. `hover` is the smooth character on quick
 * timing: four slice layers with the intensity ramped in and out across a
 * 200 ms loop, cancelling the moment the pointer leaves. `click` is
 * PowerGlitch's click preset at the site's weight — six slices, faster steps,
 * 170 ms — replayed on every click. `both` plays the hover preset on entry and
 * the click preset on a click, which is what the content surfaces use (skills
 * tiles, post cards, contact tiles). Every mode is one shot.
 *
 * The wrapped element keeps its own styles: the burst plays on clones the hook
 * stacks inside this container's grid cell (`globals.css`), so the box itself
 * is never shadowed, filtered or moved. Wrap a single element and give this
 * component the class that element's box would have had — or wrap the whole
 * box (a card) and let the container be the burst's bounding box.
 *
 * Give a host that is bigger than its content (`group`) `trigger="group"`, or
 * the burst stays inside the content box: a padded button would only glitch
 * where the content is, not where it was clicked.
 */
export function Glitch({
  children,
  className = '',
  mode,
  trigger = 'self',
}: GlitchProps) {
  const containerRef = useRef<HTMLSpanElement>(null);

  useGlitch(containerRef, mode, trigger);

  return (
    <span className={`glitch ${className}`.trim()} ref={containerRef}>
      {children}
    </span>
  );
}
