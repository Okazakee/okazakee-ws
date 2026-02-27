import { getRequestConfig } from 'next-intl/server';
import { getTranslationsSupabase } from '@/utils/getData';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale) {
    locale = 'en';
  }

  const messages = await getTranslationsSupabase(locale);

  return {
    locale,
    messages,
  };
});
