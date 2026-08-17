import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, isValidLocale } from '@/i18n/routing';
import { getTranslationsSupabase } from '@/utils/getData';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale =
    requestedLocale && isValidLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
  const messages = await getTranslationsSupabase(locale);

  return {
    locale,
    messages,
  };
});
