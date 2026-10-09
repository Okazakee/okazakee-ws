'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import type { AppLocale } from '@/i18n/routing';
import { useLocaleSwitchStore } from '@/store/localeSwitchStore';

/**
 * Segmented EN/IT switch (docs/DESIGN.md §4). Navigates to the full canonical
 * path in the other locale through the plain Next router (the destination
 * already carries its prefix), preserving query and hash, with `scroll:
 * false` plus a one-shot handoff so a briefly shorter target document cannot
 * clamp the reader back to the top.
 *
 * Article pages publish canonical per-locale destinations to the shared
 * switch store; everywhere else the locale prefix is swapped.
 */
export default function LanguageToggle() {
  const fullPathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const alternates = useLocaleSwitchStore((state) => state.alternates);
  const beginSwitch = useLocaleSwitchStore((state) => state.beginSwitch);
  const [isPending, startTransition] = useTransition();
  const [switchingTo, setSwitchingTo] = useState<AppLocale | null>(null);
  // SSR and hydration always render enabled: `disabled` depends on
  // client-only state (transition status, store alternates published after
  // mount), so evaluating it on first render mismatches the prerender.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pending target survives until the navigation commits: clearing it
  // synchronously inside startTransition would never paint the feedback.
  useEffect(() => {
    setSwitchingTo(null);
  }, [fullPathname]);

  const isItalian = locale === 'it';
  const needsCanonical = /^\/[^/]+\/(?:blog|portfolio)\/\d+\/[^/]+$/.test(
    fullPathname
  );
  // The header can hydrate before the streamed article publishes its URLs.
  // Never prefix-swap a post slug while its canonical destinations are unknown.
  const disabled =
    mounted &&
    (isPending ||
      (needsCanonical &&
        alternates?.href[locale as AppLocale] !== fullPathname));

  // Prefetchable destination for hover/focus warming. Canonical post slugs
  // when published, else the plain prefix-swapped path (same rule the
  // click handler uses).
  const previewPath = (forLocale: AppLocale): string => {
    const current = alternates?.href[locale as AppLocale];
    const canonical =
      current === fullPathname ? alternates?.href[forLocale] : null;
    const strippedPath = fullPathname.slice(locale.length + 1);
    return canonical ?? `/${forLocale}${strippedPath}`;
  };

  const switchLanguage = useCallback(
    (newLocale: AppLocale) => {
      if (newLocale === locale || switchingTo !== null || disabled) return;
      setSwitchingTo(newLocale);

      // Article pages publish canonical per-locale destinations (blog slugs
      // are localized; portfolio keeps the shared English slug — same rule
      // the page itself uses). Everywhere else the current locale prefix is
      // swapped for the new one.
      const targetPath = previewPath(newLocale);

      const query = searchParams.toString();
      const querySuffix = query ? `?${query}` : '';
      const hash =
        typeof window === 'undefined' ? '' : window.location.hash;

      beginSwitch({
        targetPath,
        x: typeof window === 'undefined' ? 0 : window.scrollX,
        y: typeof window === 'undefined' ? 0 : window.scrollY,
        minHeight:
          typeof document === 'undefined'
            ? 0
            : document.documentElement.scrollHeight,
      });

      startTransition(() => {
        router.replace(`${targetPath}${querySuffix}${hash}`, { scroll: false });
      });
    },
    [
      beginSwitch,
      fullPathname,
      disabled,
      locale,
      previewPath,
      router,
      searchParams,
      switchingTo,
    ]
  );

  // Warm the RSC payload on hover/focus so the click commits from cache.
  // Guarded: post slugs prefetch the prefix-swapped path until canonical
  // alternates publish, exactly what a click would navigate to.
  const warmLocale = (forLocale: AppLocale) => {
    if (forLocale === locale || switchingTo !== null || !mounted) return;
    try {
      router.prefetch(previewPath(forLocale));
    } catch {
      // Prefetch is best-effort; the click path never depends on it.
    }
  };

  const base = 'rounded px-3.5 py-2 transition-colors lg:px-2 lg:py-1';
  const active = `${base} bg-accent-violet/20 font-semibold text-accent-violet-light`;
  const idle = `${base} text-text-dim hover:text-text-main`;

  return (
    <div
      aria-busy={switchingTo !== null}
      className="flex items-center rounded-lg border border-border-subtle bg-surface-card p-0.5 font-mono text-xs"
    >
      <button
        aria-current={isItalian ? undefined : 'true'}
        className={`${isItalian ? idle : active} ${switchingTo === 'en' ? 'animate-pulse' : ''}`}
        disabled={disabled || switchingTo !== null}
        onClick={() => {
          switchLanguage('en');
        }}
        onFocus={() => warmLocale('en')}
        onMouseEnter={() => warmLocale('en')}
        type="button"
      >
        EN
      </button>
      <button
        aria-current={isItalian ? 'true' : undefined}
        className={`${isItalian ? active : idle} ${switchingTo === 'it' ? 'animate-pulse' : ''}`}
        disabled={disabled || switchingTo !== null}
        onClick={() => {
          switchLanguage('it');
        }}
        onFocus={() => warmLocale('it')}
        onMouseEnter={() => warmLocale('it')}
        type="button"
      >
        IT
      </button>
    </div>
  );
}
