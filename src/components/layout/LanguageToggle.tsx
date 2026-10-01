'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback, useEffect, useState } from 'react';

/**
 * Segmented EN/IT switch (docs/DESIGN.md §4). The switch is a client
 * navigation with `scroll: false`, so changing language keeps the reader on
 * the same section instead of hard-reloading and jumping to the top.
 */
export default function LanguageToggle() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const [mounted, setMounted] = useState(false);
  const isItalian = locale === 'it';

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLanguage = useCallback(() => {
    const newLocale = isItalian ? 'en' : 'it';
    const pathSegments = pathname.split('/').filter(Boolean);
    const firstSegment = pathSegments[0];
    const hasVisibleLocale = firstSegment === 'en' || firstSegment === 'it';
    const normalizedPath = pathname === '/' ? '' : pathname;

    const newPath = hasVisibleLocale
      ? [''].concat([newLocale, ...pathSegments.slice(1)]).join('/')
      : `/${newLocale}${normalizedPath}`;

    // Same page in the other locale, same scroll position.
    router.replace(`${newPath}${window.location.hash}`, { scroll: false });
  }, [pathname, isItalian, router]);

  if (!mounted) return null;

  const base = 'rounded px-3.5 py-2 transition-colors lg:px-2 lg:py-1';
  const active = `${base} bg-accent-violet/20 font-semibold text-accent-violet-light`;
  const idle = `${base} text-text-dim hover:text-text-main`;

  return (
    <div
      className="flex items-center rounded-lg border border-border-subtle bg-surface-card p-0.5 font-mono text-xs"
      data-umami-event="Language toggle"
    >
      <button
        aria-current={isItalian ? undefined : 'true'}
        className={isItalian ? idle : active}
        onClick={() => {
          if (isItalian) switchLanguage();
        }}
        type="button"
      >
        EN
      </button>
      <button
        aria-current={isItalian ? 'true' : undefined}
        className={isItalian ? active : idle}
        onClick={() => {
          if (!isItalian) switchLanguage();
        }}
        type="button"
      >
        IT
      </button>
    </div>
  );
}
