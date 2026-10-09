import Career from '@layout/mainPage/Career';
import Contacts from '@layout/mainPage/Contacts';
import Hero from '@layout/mainPage/Hero';
import PostsSection from '@layout/mainPage/PostsSections';
import Skills from '@layout/mainPage/Skills';
import { Suspense } from 'react';
import { JsonLd } from '@/components/common/JsonLd';
import { getContacts } from '@/utils/getData';
import {
  buildPersonNode,
  buildWebSiteNode,
  pickSameAs,
  SITE_NAME,
  SITE_OG_IMAGE,
} from '@/utils/structuredData';

// The home page's data access runs through `'use cache'` fetchers; on the
// first cold render in dev the cache fill trips the instant validation and
// reports the route as not instantly navigable. Later renders are cached and
// instant, so this only opts the segment out of that validation feedback
// (same opt-out as the post page).
export const instant = false;

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

      {/* Current positions render durations against the current date, which
          is dynamic at prerender time and needs its own boundary now that
          the shell no longer suspends as a whole (see Header/NavMenu). */}
      <Suspense fallback={null}>
        <Career locale={locale} />
      </Suspense>

      <PostsSection locale={locale} />

      <Contacts locale={locale} />
    </main>
  );
}
