import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';
import { withSiteCopy } from '@/i18n/siteCopy';
import { routing } from '@/i18n/routing';
import { getTranslationsSupabase } from '@/utils/getData';

export default getRequestConfig(async ({ locale }) => {
  // An explicit override (Route Handlers / Server Actions, where
  // next/root-params is unsupported) wins; otherwise the [locale] root
  // parameter is the locale.
  if (!locale) {
    const paramValue = await rootParams.locale();
    if (hasLocale(routing.locales, paramValue)) {
      locale = paramValue;
    } else {
      notFound();
    }
  }

  // Local frozen copy wins over `i18n_translations` (docs/DESIGN.md §8). This
  // is the ONLY place messages are assembled: server components resolve
  // `getTranslations` from here, and `NextIntlClientProvider` inherits them.
  // Merging only in the layout provider leaves every server `getTranslations`
  // call on raw rows and throws MISSING_MESSAGE for the frozen namespaces.
  const messages = withSiteCopy(await getTranslationsSupabase(locale), locale);

  return {
    locale,
    messages,
  };
});
