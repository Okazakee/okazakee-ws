import { create } from 'zustand';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

type LegacyMediaQueryList = Omit<
  MediaQueryList,
  'addListener' | 'removeListener'
> & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

const cookieMaxAge = 365 * 24 * 60 * 60;

// Handles from the most recent initializeTheme() run. Re-initialization
// detaches the previous listener before attaching a new one, so repeated
// calls (e.g. provider remounts) never leak duplicate matchMedia listeners.
let mediaQuery: LegacyMediaQueryList | null = null;
let mediaChangeHandler: (() => void) | null = null;

// React re-acquires the <html> singleton whenever the locale segment
// remounts the root layout, and acquireSingletonInstance strips attributes
// that are not part of its props (verified from React's own stack:
// acquireSingletonInstance -> removeAttributeNode). The theme class is not a
// React prop, so it gets stripped mid-commit — and style recalcs inside that
// same commit then compute the light palette, arming a ~150ms light→dark
// transition on every freshly mounted `transition-colors` node (measured:
// background-color keyframes rgb(244,247,252) -> rgb(17,18,21)).
//
// The restore must NOT run synchronously inside the strip call: React's
// acquire loop ends only when the attribute list is empty, and re-adding the
// class from inside it keeps the list non-empty forever (measured: the loop
// spins on `class`). A coalesced microtask drains right after the commit
// task — still before the next style recalculation — so the class is back
// before any node of the new subtree is styled.
let domGuardInstalled = false;

const installDomGuard = (read: () => ThemeState): void => {
  if (domGuardInstalled || typeof document === 'undefined') return;
  domGuardInstalled = true;

  const restoreThemeClass = (): void => {
    const { isDark } = read();
    const root = document.documentElement;
    if (root.classList.contains('dark') !== isDark) {
      root.classList.toggle('dark', isDark);
    }
  };

  let restoreQueued = false;
  const queueRestore = (): void => {
    if (restoreQueued) return;
    restoreQueued = true;
    queueMicrotask(() => {
      restoreQueued = false;
      restoreThemeClass();
    });
  };

  const originalRemoveAttribute = Element.prototype.removeAttribute;
  Element.prototype.removeAttribute = function (
    this: Element,
    name: string
  ): void {
    originalRemoveAttribute.call(this, name);
    if (this === document.documentElement && name === 'class') {
      queueRestore();
    }
  };

  const originalRemoveAttributeNode = Element.prototype.removeAttributeNode;
  Element.prototype.removeAttributeNode = function (
    this: Element,
    attr: Attr
  ): Attr {
    const removed = originalRemoveAttributeNode.call(this, attr);
    if (this === document.documentElement && attr.name === 'class') {
      queueRestore();
    }
    return removed;
  };

  // React's singleton re-acquisition runs `while (attributes.length)
  // removeAttributeNode(attributes[0])` and then immediately writes the
  // instance props (`lang`, `data-scroll-behavior`). Restoring the theme
  // class on that first write is synchronous, happens after the strip loop
  // (so it cannot feed the loop), and still precedes every other layout
  // effect and style recalc of the commit — the window where freshly mounted
  // nodes would otherwise compute the light palette and arm their
  // transition. The queued restore above stays as a fallback for removals
  // outside the singleton re-acquisition path.
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (
    this: Element,
    name: string,
    value: string
  ): void {
    originalSetAttribute.call(this, name, value);
    if (
      this === document.documentElement &&
      (name === 'lang' || name === 'data-scroll-behavior')
    ) {
      restoreThemeClass();
    }
  };
};

const useThemeStore = create<ThemeState>((set, get) => {
  // Canonical theme application: mirror the resolved theme onto the DOM so
  // Tailwind's `darkMode: 'selector'` (`dark:` variants) follows without a
  // reload. The blocking pre-paint script in the layout applies the same
  // class for the first paint.
  const applyResolvedTheme = (isDark: boolean): void => {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('dark', isDark);
  };

  const writeModeCookie = (mode: ThemeMode): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `themeMode=${mode}; path=/; max-age=${cookieMaxAge}`;
  };

  const writeResolvedThemeCookie = (isDark: boolean): void => {
    if (typeof document === 'undefined') return;
    const resolvedTheme = isDark ? 'dark' : 'light';
    document.cookie = `resolvedTheme=${resolvedTheme}; path=/; max-age=${cookieMaxAge}`;
  };

  // Helper function to determine if dark mode is active
  const isDarkActive = (mode: ThemeMode): boolean => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // For 'auto' mode, check system preference
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  };

  // Initialize with safe defaults for SSR
  const initialMode: ThemeMode = 'auto';
  const initialIsDark = false; // Safe default for SSR

  return {
    mode: initialMode,
    isDark: initialIsDark,

    initializeTheme: () => {
      if (typeof window === 'undefined') return;

      // Only explicit choices are stored. With no saved choice, keep auto
      // active so later system-theme changes still apply.
      const storedMode = localStorage.getItem('themeMode');
      const mode: ThemeMode =
        storedMode === 'light' || storedMode === 'dark'
          ? storedMode
          : 'auto';

      const isDark = isDarkActive(mode);
      set({ mode, isDark });
      applyResolvedTheme(isDark);
      installDomGuard(get);

      // Sync with cookie for SSR - store the resolved theme, not the mode
      writeModeCookie(mode);
      writeResolvedThemeCookie(isDark);

      // Detach any listener from a previous initialization before
      // registering a new one (prevents duplicate matchMedia listeners).
      if (mediaQuery && mediaChangeHandler) {
        if (typeof mediaQuery.removeEventListener === 'function') {
          mediaQuery.removeEventListener('change', mediaChangeHandler);
        } else if (typeof mediaQuery.removeListener === 'function') {
          mediaQuery.removeListener(mediaChangeHandler);
        }
      }

      // Listen for system theme changes when in auto mode
      const newMediaQuery = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ) as LegacyMediaQueryList;
      const handleSystemThemeChange = () => {
        if (get().mode !== 'auto') return;
        const isDark = newMediaQuery.matches;
        set({ isDark });
        applyResolvedTheme(isDark);
        writeResolvedThemeCookie(isDark);
      };

      mediaQuery = newMediaQuery;
      mediaChangeHandler = handleSystemThemeChange;

      if (typeof newMediaQuery.addEventListener === 'function') {
        newMediaQuery.addEventListener('change', handleSystemThemeChange);
        return;
      }

      if (typeof newMediaQuery.addListener === 'function') {
        newMediaQuery.addListener(handleSystemThemeChange);
      }
    },

    setThemeMode: (newMode: ThemeMode) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeMode', newMode);
        // Also set cookie for SSR
        writeModeCookie(newMode);
      }
      const isDark = isDarkActive(newMode);
      set({ mode: newMode, isDark });
      applyResolvedTheme(isDark);
      writeResolvedThemeCookie(isDark);
    },

    toggleTheme: () => {
      const { mode } = get();
      const newMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeMode', newMode);
        // Also set cookie for SSR
        writeModeCookie(newMode);
      }
      const isDark = isDarkActive(newMode);
      set({ mode: newMode, isDark });
      applyResolvedTheme(isDark);
      writeResolvedThemeCookie(isDark);
    },
  };
});

export default useThemeStore;
