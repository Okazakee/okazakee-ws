'use client';

import { useState, useEffect, useRef } from 'react';
import useThemeStore, { type ThemeMode } from '@/store/themeStore';
import { Sun, Moon, Smartphone, Monitor } from 'lucide-react';

export default function ThemeToggle({
  compact = false,
}: { compact?: boolean }) {
  const { mode, setThemeMode, isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  // Initialize systemIsDark using the same check from the store
  const initialIsDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [systemIsDark, setSystemIsDark] = useState(initialIsDark);
  const initialRender = useRef(true);

  useEffect(() => {
    setMounted(true);

    // Force a re-render to ensure correct dark mode detection
    if (initialRender.current) {
      initialRender.current = false;
      const darkModePreference = window.matchMedia(
        '(prefers-color-scheme: dark)'
      );
      setSystemIsDark(darkModePreference.matches);
    }

    // Listen for changes in system preference
    const darkModePreference = window.matchMedia(
      '(prefers-color-scheme: dark)'
    );
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
    ? 'flex items-center justify-center rounded-xl border-2 border-darktext dark:border-lighttext transition-colors duration-300 ease-in-out w-fit px-3 h-10'
    : 'relative flex justify-center items-center border-2 border-darktext dark:border-lighttext rounded-xl transition-colors duration-300 ease-in-out h-[4rem] w-[12rem] lg:h-10 lg:w-[12rem]';

  // Helper function to cycle through modes: auto -> light -> dark -> auto
  const cycleThemeMode = () => {
    // Also update system state on click to ensure it's current
    const systemDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches;
    if (systemDark !== systemIsDark) {
      setSystemIsDark(systemDark);
    }

    const modes: ThemeMode[] = ['auto', 'light', 'dark'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  if (compact) {
    return (
      <button type="button" onClick={cycleThemeMode} className={buttonClass}>
        <div className="flex items-center gap-2">
          <div className="relative w-[20px] h-[20px] flex items-center justify-center">
            <Monitor
              size={18}
              className={`transition-all duration-300 ease-in-out absolute left-0 z-10 ${
                mode === 'auto' ? 'opacity-100' : 'opacity-0'
              } ${isActuallyDark ? 'text-lighttext' : 'text-darktext'}`}
            />
            <Sun
              size={18}
              className={`transition-all text-darktext duration-300 ease-in-out absolute left-0 ${mode === 'light' ? 'opacity-100' : 'opacity-0'}`}
            />
            <Moon
              size={18}
              className={`transition-all text-lighttext duration-300 ease-in-out absolute left-0 ${mode === 'dark' ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
          <span className="text-sm font-medium text-darktext dark:text-lighttext -mb-0.5 transition-all duration-300 ease-in-out">
            {mode === 'auto' && 'Auto'}
            {mode === 'light' && 'Light'}
            {mode === 'dark' && 'Dark'}
          </span>
        </div>
      </button>
    );
  }

  return (
    <button type="button" onClick={cycleThemeMode} className={buttonClass}>
      <div className="flex items-center gap-3">
        <div className="relative w-[1.875rem] h-[1.875rem] flex items-center justify-center">
          {mode === 'auto' && (
            <Monitor
              size={24}
              className={`z-10 ${isActuallyDark ? 'text-lighttext' : 'text-darktext'}`}
            />
          )}
          {mode === 'light' && <Sun size={24} className="text-darktext" />}
          {mode === 'dark' && <Moon size={24} className="text-lighttext" />}
        </div>
        <div className="text-base text-darktext dark:text-lighttext transition-all duration-300 ease-in-out">
          {mode === 'light' && 'Light Mode'}
          {mode === 'dark' && 'Dark Mode'}
          {mode === 'auto' && 'Auto'}
        </div>
      </div>
    </button>
  );
}
