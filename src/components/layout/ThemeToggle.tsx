'use client';

import useThemeStore, { type ThemeMode } from '@/store/themeStore';
import { Monitor, Moon, Smartphone, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function ThemeToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
  const { mode, setThemeMode, isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  // Initialize systemIsDark using the same check from the store
  const [systemIsDark, setSystemIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get system preference after hydration
    const darkModePreference = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );
    setSystemIsDark(darkModePreference.matches);

    // Listen for changes in system preference
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemIsDark(event.matches);
    };

    darkModePreference.addEventListener('change', handleChange);
    return () => darkModePreference.removeEventListener('change', handleChange);
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
