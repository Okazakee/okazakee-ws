'use client';

import type React from 'react';
import { useEffect } from 'react';
import useThemeStore from '../store/themeStore';

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isDark } = useThemeStore();

  useEffect(() => {
    // Toggle dark class on the HTML element
    document.body.classList.toggle('dark', isDark);
  }, [isDark]);

  return <>{children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
