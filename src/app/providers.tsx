'use client';

import type React from 'react';
import { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    const id = requestIdleCallback(() => initializeTheme());
    return () => cancelIdleCallback(id);
  }, [initializeTheme]);

  useEffect(() => {
    const pathLocale = window.location.pathname.split('/')[1];
    if (['en', 'it'].includes(pathLocale)) {
      document.documentElement.lang = pathLocale;
    }
  }, []);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
