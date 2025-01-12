import { getTranslationsSupabase } from "@/utils/getData";

export default async function request({ requestLocale }: { requestLocale: Promise<string | undefined> }) {
let locale = await requestLocale;

  if (!locale) {
    locale = 'en';
  }

  const messages = await getTranslationsSupabase(locale);

  return {
    locale,
    messages
  };
}