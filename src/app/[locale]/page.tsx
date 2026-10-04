import Career from '@layout/mainPage/Career';
import Contacts from '@layout/mainPage/Contacts';
import Hero from '@layout/mainPage/Hero';
import PostsSection from '@layout/mainPage/PostsSections';
import Skills from '@layout/mainPage/Skills';
import { JsonLd } from '@/components/common/JsonLd';
import { getContacts } from '@/utils/getData';
import {
  buildPersonNode,
  buildWebSiteNode,
  pickSameAs,
  SITE_NAME,
  SITE_OG_IMAGE,
} from '@/utils/structuredData';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normalizedLocale = locale === 'it' ? 'it' : 'en';
  const baseUrl = process.env.DOMAIN_URL;

  const pageDesc =
    locale === 'en'
      ? 'Full-stack and mobile developer working across web, mobile, Bitcoin, Lightning, Nostr and wallet/payment infrastructure.'
      : 'Sviluppatore full-stack e mobile attivo su web, mobile, Bitcoin, Lightning, Nostr e infrastrutture wallet e pagamenti.';

  const pageTitle = 'Home - Okazakee WS';

  return {
    title: pageTitle,
    description: pageDesc,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: pageTitle,
      description: pageDesc,
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDesc,
      images: [SITE_OG_IMAGE],
    },
    alternates: {
      canonical: `${baseUrl}/${normalizedLocale}`,
      languages: {
        en: `${baseUrl}/en`,
        it: `${baseUrl}/it`,
        'x-default': `${baseUrl}/en`,
      },
    },
  };
}

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'it' }];
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const baseUrl = process.env.DOMAIN_URL ?? '';
  const contacts =
    (await getContacts())?.sort((a, b) => a.position - b.position) ?? [];
  const sameAs = pickSameAs(contacts.map((contact) => contact.link));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [buildPersonNode(baseUrl, sameAs), buildWebSiteNode(baseUrl)],
  };

  return (
    <main>
      <JsonLd data={jsonLd} />
      <Hero locale={locale} />

      <Skills locale={locale} />

      <Career locale={locale} />

      <PostsSection locale={locale} />

      <Contacts locale={locale} />
    </main>
  );
}
