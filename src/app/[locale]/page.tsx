import React from "react";
import { Metadata } from "next";
import Contacts from "@components/landing/Contacts";
import Skills from "@components/landing/Skills";
import Hero from "@components/landing/Hero";
import { getHeroSection, getPortfolioSection, getContacts, getBlogSection } from "@/utils/getData";
import PostsSection from "@/components/landing/PostsSections";
import { ErrorDiv } from "@/components/common/ErrorDiv";

export const metadata: Metadata = {
  title: "Home - Okazakee WS",
  description: "Personal website with portfolio and blog",
  openGraph: {
    title: "Home - Okazakee WS",
    description: "Personal website with portfolio and blog",
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

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'it' }];
}

export default async function Home({
  params
}: {
  params: Promise<{ post_type: string; locale: string }>
}) {

  const { locale } = await params;

  const heroSection = await getHeroSection();
  const portfolioSection = await getPortfolioSection();
  const blogSection = await getBlogSection();
  const contactSection = await getContacts();

  return (
    <main className="mx-auto md:max-w-7xl mt-10 md:mt-0">

      {!heroSection ? <ErrorDiv>Error loading Hero data</ErrorDiv> : <Hero heroSection={heroSection} />}

      <Skills />

      {!portfolioSection ? <ErrorDiv>Error loading Portfolio data</ErrorDiv> : <PostsSection section={portfolioSection} locale={locale} />}

      {!blogSection ? <ErrorDiv>Error loading Blog data</ErrorDiv> : <PostsSection section={blogSection} locale={locale} />}

      <Contacts />

    </main>
  );
}