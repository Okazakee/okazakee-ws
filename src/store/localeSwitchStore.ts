import { create } from 'zustand';
import type { AppLocale } from '@/i18n/routing';

export type LocaleAlternates = {
  /** Identity of the content the alternates describe (e.g. `blog:9`). */
  key: string;
  /** Canonical destination per locale. */
  href: Record<AppLocale, string>;
};

export type LocaleSwitchHandoff = {
  sourcePath: string;
  previousMinHeight: string;
  /** Exact destination pathname the switch navigated to. */
  targetPath: string;
  /** Scroll position captured before the switch. */
  x: number;
  y: number;
  /** Minimum document height to hold while the target commits. */
  minHeight: number;
};

interface LocaleSwitchState {
  /** Canonical per-locale destinations published by the current page. */
  alternates: LocaleAlternates | null;
  handoff: LocaleSwitchHandoff | null;
  publishAlternates: (alternates: LocaleAlternates | null) => void;
  beginSwitch: (
    handoff: Omit<LocaleSwitchHandoff, 'sourcePath' | 'previousMinHeight'>
  ) => void;
  consumeSwitch: (targetPath: string) => LocaleSwitchHandoff | null;
  clearSwitch: () => void;
}

/**
 * Shared state for language switches.
 *
 * Alternates live here (not in a context) because the header switcher sits
 * above the page in the tree: a context published by the article would never
 * reach it. The page publishes on mount and clears on unmount.
 *
 * The handoff is one-shot scroll preservation: `scroll: false` stops Next
 * from scrolling, but it cannot stop the browser clamping scroll when the
 * incoming document is briefly shorter. The toggle captures position + a
 * height floor before navigating; the target page holds that floor until its
 * own content commits, then restores once and clears. Ordinary navigation
 * never touches this store, so Back/Forward is unaffected.
 */
export const useLocaleSwitchStore = create<LocaleSwitchState>((set, get) => ({
  alternates: null,
  handoff: null,

  publishAlternates: (alternates) => {
    set({ alternates });
  },

  beginSwitch: (handoff) => {
    if (typeof window === 'undefined') return;
    get().clearSwitch();
    const root = document.documentElement;
    const previousMinHeight = root.style.minHeight;
    // Reserve height before navigation, not after the shorter page commits.
    root.style.minHeight = `${Math.ceil(handoff.minHeight)}px`;
    set({
      handoff: {
        ...handoff,
        sourcePath: window.location.pathname,
        previousMinHeight,
      },
    });
  },

  consumeSwitch: (targetPath) => {
    const { handoff } = get();
    if (!handoff || handoff.targetPath !== targetPath) return null;
    set({ handoff: null });
    return handoff;
  },

  clearSwitch: () => {
    const { handoff } = get();
    if (!handoff) return;
    const root = document.documentElement;
    root.style.minHeight = handoff.previousMinHeight;
    set({ handoff: null });
  },
}));
