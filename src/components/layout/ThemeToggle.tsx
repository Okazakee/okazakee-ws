'use client';

import { Moon, Smartphone, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import useThemeStore, { type ThemeMode } from '@/store/themeStore';

type LegacyMediaQueryList = Omit<
  MediaQueryList,
  'addListener' | 'removeListener'
> & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export default function ThemeToggle({
  compact = false,
  sidebar = false,
  icon = false,
  ariaLabel,
}: {
  compact?: boolean;
  sidebar?: boolean;
  icon?: boolean;
  ariaLabel?: string;
}) {
  const { mode, setThemeMode } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  // Initialize systemIsDark using the same check from the store
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get system preference after hydration
    const darkModePreference = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ) as LegacyMediaQueryList;
    setSystemIsDark(darkModePreference.matches);

    // Listen for changes in system preference
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
    };

    if (typeof darkModePreference.addEventListener === 'function') {
      darkModePreference.addEventListener('change', handleChange);
      return () =>
        darkModePreference.removeEventListener('change', handleChange);
    }

    if (typeof darkModePreference.addListener === 'function') {
      darkModePreference.addListener(handleChange);
      return () => darkModePreference.removeListener?.(handleChange);
    }
  }, []);

  if (!mounted) {
    return null;
  }

  // Determine if we're actually in dark mode (either directly or via system preference)
  const isActuallyDark = mode === 'dark' || (mode === 'auto' && systemIsDark);

  const buttonClass = compact
    ? 'flex items-center justify-center rounded-2xl border-2 border-main transition-all duration-300 ease-in-out w-fit px-3 h-10'
    : 'flex justify-center items-center border-2 border-white dark:border-white rounded-2xl transition-all duration-300 ease-in-out h-16 w-48 lg:h-10 lg:w-48 lg:border-main';

  // Helper function to cycle through modes: auto -> light -> dark -> auto
  const cycleThemeMode = () => {
    // Also update system state on click to ensure it's current, after hydration
    if (typeof window !== 'undefined') {
      const systemDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      if (systemDark !== systemIsDark) {
        setSystemIsDark(systemDark);
      }
    }

    const modes: ThemeMode[] = ['auto', 'light', 'dark'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  if (sidebar) {
    const SidebarIcon =
      mode === 'light' ? Sun : mode === 'dark' ? Moon : Smartphone;
    return (
      <button
        type="button"
        onClick={cycleThemeMode}
        className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-darkergray dark:hover:bg-darkgray text-darktext dark:text-lighttext hover:text-darktext dark:hover:text-white transition-all duration-200"
        data-umami-event="Theme toggle"
      >
        <SidebarIcon className="w-4 h-4 flex-shrink-0" />
        <span className="font-medium text-sm truncate">
          {mode === 'auto' && 'Auto'}
          {mode === 'light' && 'Light'}
          {mode === 'dark' && 'Dark'}
        </span>
      </button>
    );
  }

  if (icon) {
    const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Smartphone;
    return (
      <button
        aria-label={ariaLabel}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-dim transition-colors hover:border-accent-violet/40 hover:text-accent-violet-light lg:h-auto lg:w-auto lg:p-1.5"
        data-umami-event="Theme toggle"
        onClick={cycleThemeMode}
        type="button"
      >
        <Icon className="h-[18px] w-[18px] lg:h-[17px] lg:w-[17px]" strokeWidth={2} />
      </button>
    );
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={cycleThemeMode}
        className={buttonClass}
        data-umami-event="Theme toggle"
      >
        <span className="text-sm font-medium text-darktext dark:text-lighttext transition-all duration-300 ease-in-out">
          {mode === 'auto' && 'Auto'}
          {mode === 'light' && 'Light'}
          {mode === 'dark' && 'Dark'}
        </span>
      </button>
    );
  }

  return (
    <button type="button" onClick={cycleThemeMode} className={buttonClass}>
      <div className="flex items-center justify-center w-full">
        <div className="relative w-4 h-4 lg:w-6 lg:h-6 flex items-center justify-center mr-2">
          <div
            className={`absolute transition-opacity duration-300 ${
              mode === 'auto' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Smartphone
              size={16}
              strokeWidth={2}
              className={`lg:w-6 lg:h-6 ${
                isActuallyDark ? 'text-lighttext' : 'text-darktext'
              }`}
            />
          </div>
          <div
            className={`absolute transition-opacity duration-300 ${
              mode === 'light' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Sun
              size={16}
              strokeWidth={2}
              className="lg:w-6 lg:h-6 text-darktext"
            />
          </div>
          <div
            className={`absolute transition-opacity duration-300 ${
              mode === 'dark' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Moon
              size={16}
              strokeWidth={2}
              className="lg:w-6 lg:h-6 text-lighttext"
            />
          </div>
        </div>
        <div className="text-xl lg:text-base text-darktext dark:text-lighttext whitespace-nowrap">
          {mode === 'light' && 'Light Mode'}
          {mode === 'dark' && 'Dark Mode'}
          {mode === 'auto' && 'Auto'}
        </div>
      </div>
    </button>
  );
}
