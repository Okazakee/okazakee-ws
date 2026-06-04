'use client';

import type React from 'react';
import { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

type IdleHandle = number | ReturnType<typeof setTimeout>;

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { initializeTheme } = useThemeStore();

  useEffect(() => {
    let idleHandle: IdleHandle;

    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(() => initializeTheme());

      return () => window.cancelIdleCallback(idleHandle as number);
    }

    idleHandle = window.setTimeout(() => initializeTheme(), 1);
    return () => window.clearTimeout(idleHandle);
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
