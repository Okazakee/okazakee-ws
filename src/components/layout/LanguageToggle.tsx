'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useTransition } from 'react';
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
  const isItalian = locale === 'it';
  const needsCanonical = /^\/[^/]+\/(?:blog|portfolio)\/\d+\/[^/]+$/.test(
    fullPathname
  );
  // The header can hydrate before the streamed article publishes its URLs.
  // Never prefix-swap a post slug while its canonical destinations are unknown.
  const disabled =
    isPending ||
    (needsCanonical &&
      alternates?.href[locale as AppLocale] !== fullPathname);

  const switchLanguage = useCallback(
    (newLocale: AppLocale) => {
      if (newLocale === locale || switchingTo !== null || disabled) return;
      setSwitchingTo(newLocale);

      // Article pages publish canonical per-locale destinations (blog slugs
      // are localized; portfolio keeps the shared English slug — same rule
      // the page itself uses). Everywhere else the current locale prefix is
      // swapped for the new one.
      const canonical =
        alternates?.href[locale as AppLocale] === fullPathname
          ? alternates.href[newLocale]
          : null;
      const strippedPath = fullPathname.slice(locale.length + 1);
      const targetPath = canonical ?? `/${newLocale}${strippedPath}`;
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
        setSwitchingTo(null);
      });
    },
    [
      alternates,
      beginSwitch,
      fullPathname,
      disabled,
      locale,
      router,
      searchParams,
      switchingTo,
    ]
  );

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
        disabled={disabled}
        className={isItalian ? idle : active}
        onClick={() => {
          switchLanguage('en');
        }}
        type="button"
      >
        EN
      </button>
      <button
        aria-current={isItalian ? 'true' : undefined}
        disabled={disabled}
        className={isItalian ? active : idle}
        onClick={() => {
          switchLanguage('it');
        }}
        type="button"
      >
        IT
      </button>
    </div>
  );
}
