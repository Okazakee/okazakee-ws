import type { RefObject } from 'react';
import { useEffect, useRef } from 'react';
import {
  type GlitchMode,
  type GlitchOptions,
  type GlitchPreset,
  clampGlitchToBox,
  generateGlitchLayers,
  glitchPresets,
} from '@/libs/glitch/layers';

/**
 * What starts the burst: the container itself, or the nearest `.group`
 * ancestor — the marker the site puts on every hover host, for a tile whose
 * content sits inside its padding and should glitch from its whole box.
 */
export type GlitchTrigger = 'self' | 'group';

/**
 * What starts the burst, and what plays.
 */
export type GlitchConfig = {
  /** Which triggers are wired: `hover`, `click`, or `both`. */
  mode: GlitchMode;
  /** What starts a burst: the container itself, or the nearest `.group`. */
  trigger?: GlitchTrigger;
  /** Probability from 0 through 1 that an eligible trigger starts a burst. */
  probability?: number;
  /**
   * Preset the **hover** trigger plays. It is the canon tear by default; cards
   * override it with the click's flicker, because a sideways tear reads as a
   * broken layout at their size. A click always plays the click preset.
   */
  hoverPreset?: GlitchPreset;
  /**
   * Burst when this flips to `true`: the escape hatch for a state change that
   * is not a pointer event, like the scroll-spy moving the nav highlight. Pass
   * the state the element already renders — its active class, its
   * `aria-current` — as one boolean. Nothing plays on mount, so a page that
   * loads with something already active stays quiet until it changes.
   */
  active?: boolean;
};

/**
 * Plays a ported PowerGlitch burst (docs/DESIGN.md §3) on the first element
 * child of `containerRef`.
 *
 * That child is the glitched element: it plays the shake layer and stays the
 * only interactive copy. Every slice layer is a plain DOM clone of it, so any
 * content works, and the clones are created on the first trigger rather than
 * at mount — an untouched page carries no copies at all. A copy is invisible
 * (`opacity: 0`) except while its own animation runs, so the layers cannot
 * leak into the layout or the paint when nothing is playing.
 *
 * Every eligible trigger samples `probability`: `1` always plays, while a lower
 * value leaves that interaction still. Hover cancels on leave; click cancels
 * and replays when its sample starts a burst.
 *
 * The preset is clamped to the box the element actually has before its layers
 * are generated (`clampGlitchToBox`), because its travels are percentages: the
 * recipe tuned on a skill tile would otherwise throw a full-width card around
 * and shudder it sideways. Whatever the box, the burst stays the size the tile
 * established.
 *
 * `prefers-reduced-motion: reduce` is read before any of this exists, so those
 * readers get no listeners and no clones at all. The global CSS rule that
 * flattens `animation-duration` cannot reach a WAAPI animation, so the choice
 * has to be made here (the hero's still frame takes the same view).
 */
export function useGlitch(
  containerRef: RefObject<HTMLElement | null>,
  {
    mode,
    trigger = 'self',
    hoverPreset = 'hover',
    active = false,
    probability = 1,
  }: GlitchConfig
): void {
  // The setup effect owns everything the burst needs; this handle is how the
  // state effect below reaches it without re-running the setup on every
  // highlight change (which would cancel a burst already in flight).
  const playRef = useRef<(preset: GlitchPreset) => void>(() => {});
  const mounted = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const shouldPlay = () => Math.random() < probability;

    let copies: HTMLElement[] | null = null;

    // Node i plays layer i: the glitched element shakes, one copy per remaining
    // slice layer clips, shifts and tints a band. Both are resolved from the
    // DOM on every trigger, because React may swap the glitched element itself
    // under the copies, which detaches whatever we captured last time. The
    // copies carry their own marker rather than relying on `aria-hidden`: the
    // host's content is often `aria-hidden` too (every lucide icon is).
    //
    // The preset is generated against the box this element has right now: its
    // travels are percentages of that box, and clamping them is what keeps a
    // 976px card as slight as the 285px tile it is modelled on.
    const play = (preset: GlitchOptions) => {
      const base = container.querySelector<HTMLElement>(
        ':scope > :not([data-glitch-layer])'
      );
      if (!base) return;

      const layers = generateGlitchLayers(
        clampGlitchToBox(preset, base.getBoundingClientRect())
      );

      const stale =
        !copies ||
        copies.length !== layers.length - 1 ||
        copies.some((copy) => !copy.isConnected);

      if (stale) {
        for (const copy of copies ?? []) copy.remove();
        copies = layers.slice(1).map(() => {
          const copy = base.cloneNode(true) as HTMLElement;
          copy.dataset.glitchLayer = 'true';
          copy.setAttribute('aria-hidden', 'true');
          copy.style.opacity = '0';
          copy.style.pointerEvents = 'none';
          copy.style.userSelect = 'none';
          container.append(copy);
          return copy;
        });
      }

      const nodes: HTMLElement[] = [base, ...(copies ?? [])];
      for (const [index, node] of nodes.entries()) {
        node.animate(layers[index].steps, layers[index].timing);
      }
    };

    // The state trigger uses the same probability and presets as the pointer.
    playRef.current = (preset) => {
      if (shouldPlay()) play(glitchPresets[preset]);
    };

    // Whatever the container holds — a layer mid-burst, a stale copy, the base
    // — stopping means cancelling what is running. Nothing is created here, so
    // a leave-before-enter never pays for clones it will not use.
    const cancel = () => {
      for (const node of container.children) {
        for (const animation of node.getAnimations()) animation.cancel();
      }
    };

    const host =
      trigger === 'group'
        ? (container.closest('.group') ?? container)
        : container;

    const onEnter = () => {
      if (shouldPlay()) play(glitchPresets[hoverPreset]);
    };
    // A click replays its own preset over whatever the hover left behind; the
    // two differ in layer count, which `play` handles by rebuilding the copies.
    const onClick = () => {
      if (!shouldPlay()) return;
      cancel();
      play(glitchPresets.click);
    };

    if (mode !== 'click') {
      host.addEventListener('mouseenter', onEnter);
      host.addEventListener('mouseleave', cancel);
    }
    if (mode !== 'hover') {
      host.addEventListener('click', onClick);
    }

    return () => {
      host.removeEventListener('mouseenter', onEnter);
      host.removeEventListener('mouseleave', cancel);
      host.removeEventListener('click', onClick);
      cancel();
      for (const copy of copies ?? []) copy.remove();
    };
  }, [containerRef, mode, trigger, hoverPreset, probability]);

  // A state change — the scroll-spy moving the highlight — bursts exactly like
  // a hover does. The first run is skipped, so a page that loads with a section
  // already active never glitches on arrival; only a change does.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (active) playRef.current(hoverPreset);
  }, [active, hoverPreset]);
}
