'use client'
import React, { useState, useEffect, PropsWithChildren } from 'react';
import useThemeStore from '../store/themeStore';

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

export default ThemeProvider;