import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'it'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: true,
  // Hreflang is emitted per page from metadata (with the real localized
  // slugs); disable the middleware's locale-swap Link headers to keep a
  // single source of truth.
  alternateLinks: false,
});

export type AppLocale = (typeof routing.locales)[number];

export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;

export function isValidLocale(locale: string): locale is AppLocale {
  return (routing.locales as readonly string[]).includes(locale);
}
