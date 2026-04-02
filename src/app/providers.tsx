'use client';

import type React from 'react';
import { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isDark, initializeTheme } = useThemeStore();

  useEffect(() => {
    // Initialize theme after hydration
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    // Sync html lang attribute from URL path (layout renders "en" as static default)
    const pathLocale = window.location.pathname.split('/')[1];
    if (['en', 'it'].includes(pathLocale)) {
      document.documentElement.lang = pathLocale;
    }
  }, []);

  useEffect(() => {
    // Apply theme class to html element
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
