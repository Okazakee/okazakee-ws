import type { RefObject } from 'react';
import { useEffect } from 'react';
import {
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
 * Both modes are one shot, and both stop where they started: `hover` plays on
 * entry and cancels on leave, `click` cancels and replays on every click.
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
    const glitched = container?.firstElementChild;
    if (!(container && glitched instanceof HTMLElement)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const layers = generateGlitchLayers(glitchPresets[mode]);
    let copies: HTMLElement[] | null = null;

    // Node i plays layer i, by construction: the glitched element shakes, and
    // one copy per remaining slice layer clips, shifts and tints a band.
    const play = () => {
      copies ??= layers.slice(1).map(() => {
        const copy = glitched.cloneNode(true) as HTMLElement;
        copy.setAttribute('aria-hidden', 'true');
        copy.style.opacity = '0';
        copy.style.pointerEvents = 'none';
        copy.style.userSelect = 'none';
        container.append(copy);
        return copy;
      });

      [glitched, ...copies].forEach((node, index) => {
        node.animate(layers[index].steps, layers[index].timing);
      });
    };

    const cancel = () => {
      for (const node of copies ? [glitched, ...copies] : [glitched]) {
        for (const animation of node.getAnimations()) animation.cancel();
      }
    };

    const host =
      trigger === 'group'
        ? (container.closest('.group') ?? container)
        : container;

    const restart = () => {
      cancel();
      play();
    };

    if (mode === 'hover') {
      host.addEventListener('mouseenter', play);
      host.addEventListener('mouseleave', cancel);
    } else {
      host.addEventListener('click', restart);
    }

    return () => {
      host.removeEventListener('mouseenter', play);
      host.removeEventListener('mouseleave', cancel);
      host.removeEventListener('click', restart);
      cancel();
      for (const copy of copies ?? []) copy.remove();
    };
  }, [containerRef, mode, trigger]);
}
