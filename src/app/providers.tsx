'use client';

import React, { useState, useEffect, PropsWithChildren } from 'react';
import useThemeStore from '../store/themeStore';
import { ParallaxProvider } from 'react-scroll-parallax';

const ThemeProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, [isDark, mounted]);

  return <>{mounted && children}</>;
};

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider><ParallaxProvider>{children}</ParallaxProvider></ThemeProvider>;
}