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
 * timing: six slice layers with the intensity ramped in and out across a
 * 320 ms loop, cancelling the moment the pointer leaves. `click` is
 * PowerGlitch's own click preset — fifteen slices, faster steps — replayed on
 * every click. Both are one shot.
 *
 * The wrapped element keeps its own styles: the burst plays on clones the hook
 * stacks inside this container's grid cell (`globals.css`), so the box itself
 * is never shadowed, filtered or moved. Wrap a single element, and give this
 * component the class that element's box would have had.
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
