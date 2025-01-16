import React from "react";
import Contacts from "@components/landing/Contacts";
import Skills from "@components/landing/Skills";
import Hero from "@components/landing/Hero";
import PostsSection from "@/components/landing/PostsSections";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>
}) {

  const { locale } = await params;

  const pageDesc = locale === 'en' ? 'Personal website with portfolio and blog' : 'Sito personale con portfolio e blog';

  return {
    title: "Home - Okazakee WS",
    description: pageDesc,
    openGraph: {
      title: "Home - Okazakee WS",
      description: pageDesc,
      images: [
        {
          url: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/logo.png',
          width: 1200,
          height: 630,
          alt: 'logo',
        },
      ],
    }
  };
}

export const revalidate = process.env.ISR_REVALIDATION;

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'it' }];
}

export default async function Home({
  params
}: {
  params: Promise<{ post_type: string; locale: string }>
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