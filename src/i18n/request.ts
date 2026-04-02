import { getRequestConfig } from 'next-intl/server';
import { getTranslationsSupabase } from '@/utils/getData';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || 'en';
  const messages = await getTranslationsSupabase(locale);

  return {
    locale,
    messages,
  };
});
