import React from 'react';
import Contacts from '@layout/mainPage/Contacts';
import Skills from '@layout/mainPage/Skills';
import Hero from '@layout/mainPage/Hero';
import PostsSection from '@layout/mainPage/PostsSections';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const pageDesc =
    locale === 'en'
      ? 'Personal website with portfolio and blog'
      : 'Sito personale con portfolio e blog';

  return {
    title: 'Home - Okazakee WS',
    description: pageDesc,
    openGraph: {
      title: 'Home - Okazakee WS',
      description: pageDesc,
      images: [
        {
          url: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/Website%20Assets/logo.png',
          width: 1200,
          height: 630,
          alt: 'logo',
        },
      ],
    },
  };
}

export const revalidate = 86400;

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'it' }];
}

export default async function Home({
  params,
}: {
  params: Promise<{ post_type: string; locale: string }>;
}) {
  const { locale } = await params;

  return (
    <main className="mx-auto md:max-w-7xl mt-10 md:mt-0">
      <Hero />

      <Skills />

      <PostsSection locale={locale} />

      <Contacts />
    </main>
  );
}
