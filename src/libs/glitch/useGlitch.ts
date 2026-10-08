import type { RefObject } from 'react';
import { useEffect } from 'react';
import {
  type GlitchLayer,
  type GlitchMode,
  generateGlitchLayers,
  glitchPresets,
} from '@/libs/glitch/layers';

/**
 * What starts the burst: the container itself, or the nearest `.group`
 * ancestor — the marker the site puts on every hover host, for a card whose
 * content sits inside its padding and should glitch from its whole box.
 */
export type GlitchTrigger = 'self' | 'group';

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
 * One shot each way, and both stop where they started: `hover` plays on entry
 * and cancels on leave, `click` cancels and replays on every click, `both` does
 * both (the hover preset on entry, the click preset on a click).
 *
 * `prefers-reduced-motion: reduce` is read before any of this exists, so those
 * readers get no listeners and no clones at all. The global CSS rule that
 * flattens `animation-duration` cannot reach a WAAPI animation, so the choice
 * has to be made here (the hero's still frame takes the same view).
 */
export function useGlitch(
  containerRef: RefObject<HTMLElement | null>,
  mode: GlitchMode,
  trigger: GlitchTrigger = 'self'
): void {
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const hoverLayers =
      mode === 'click' ? null : generateGlitchLayers(glitchPresets.hover);
    const clickLayers =
      mode === 'hover' ? null : generateGlitchLayers(glitchPresets.click);
    let copies: HTMLElement[] | null = null;

    // Node i plays layer i: the glitched element shakes, one copy per remaining
    // slice layer clips, shifts and tints a band. Both are resolved from the
    // DOM on every trigger, because React may swap the glitched element itself
    // under the copies, which detaches whatever we captured last time. The
    // copies carry their own marker rather than relying on `aria-hidden`: the
    // host's content is often `aria-hidden` too (every lucide icon is).
    const play = (layers: GlitchLayer[]) => {
      const base = container.querySelector<HTMLElement>(
        ':scope > :not([data-glitch-layer])'
      );
      if (!base) return;

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
      if (hoverLayers) play(hoverLayers);
    };
    // A click replays its own preset over whatever the hover left behind; the
    // two presets differ in layer count, which `play` handles by rebuilding.
    const onClick = () => {
      const layers = clickLayers ?? hoverLayers;
      if (!layers) return;
      cancel();
      play(layers);
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
  }, [containerRef, mode, trigger]);
}
