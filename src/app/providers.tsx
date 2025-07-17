'use client';

import type React from 'react';
import { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { mode, isDark, initializeTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme after hydration
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    // Apply theme class to html element
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
