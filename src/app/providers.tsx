'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import useThemeStore from '@/store/themeStore';

export function Providers({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  const initializeTheme = useThemeStore((state) => state.initializeTheme);
  const themeInserted = useRef(false);

  // Insert only into the server-rendered head before paint, once across
  // stream flushes; ordinary client renders never return this script.
  useServerInsertedHTML(() => {
    if (themeInserted.current) return null;
    themeInserted.current = true;

    return (
      <script
        id="theme-init"
        dangerouslySetInnerHTML={{
          __html: `(() => {
  try {
    var m = localStorage.getItem('themeMode');
    var isDark =
      m === 'dark' ||
      (m !== 'light' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();`,
        }}
      />
    );
  });

  // Locale navigation can remount the document shell. Restore the saved
  // theme before paint rather than leaving light styles visible until idle.
  useLayoutEffect(() => {
    initializeTheme();
  }, [initializeTheme, locale]);

  return <>{children}</>;
}
