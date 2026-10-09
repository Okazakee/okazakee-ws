'use client';

import { useServerInsertedHTML } from 'next/navigation';
import { type ReactNode, useLayoutEffect, useRef } from 'react';
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

  // SSR-only injection: runs during the server render, never re-renders on
  // client navigation, so React never sees a client-rendered <script>.
  // First paint on document loads; SPA locale switches keep <html> as-is
  // and the layout effect below re-applies the saved theme.
  useServerInsertedHTML(() => {
    if (themeInserted.current) return null;
    themeInserted.current = true;

    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `(() => {
  try {
    var c = {};
    document.cookie.split(';').forEach(function (p) {
      var i = p.indexOf('=');
      if (i > 0) c[p.slice(0, i).trim()] = p.slice(i + 1).trim();
    });
    var m = null;
    try {
      m = localStorage.getItem('themeMode');
    } catch (e) {}
    m = m || c.themeMode;
    var isDark =
      m === 'dark' ||
      (m !== 'light' &&
        (c.resolvedTheme === 'dark' ||
          window.matchMedia('(prefers-color-scheme: dark)').matches));
    document.documentElement.classList.toggle('dark', isDark);
  } catch (e) {}
})();`,
        }}
        id="theme-init"
      />
    );
  });

  useLayoutEffect(() => {
    initializeTheme();
  }, [initializeTheme, locale]);

  return <>{children}</>;
}
