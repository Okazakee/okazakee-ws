import { getRequestConfig } from 'next-intl/server';
import { withSiteCopy } from '@/i18n/siteCopy';
import { defaultLocale, isValidLocale } from '@/i18n/routing';
import { getTranslationsSupabase } from '@/utils/getData';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale =
    requestedLocale && isValidLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
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
