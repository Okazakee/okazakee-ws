import { getRequestConfig } from 'next-intl/server';
import { getTranslationsSupabase } from '@/utils/getData';
import cmsEn from './messages/cms.en.json';
import cmsIt from './messages/cms.it.json';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) || 'en';
  const messages = await getTranslationsSupabase(locale);
  const cmsMessages = locale === 'it' ? cmsIt : cmsEn;

  return {
    locale,
    messages: { ...messages, cms: cmsMessages },
  };
});
