import React from "react";
import { Metadata } from "next";
import Contacts from "@components/landing/Contacts";
import Skills from "@components/landing/Skills";
import Hero from "@components/landing/Hero";
import { getHeroSection, getSkillsSection, getPortfolioSection, getContactsSection, getBlogSection } from "@/utils/getData";
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
  // This function is empty because we're only generating one page
  // If you had multiple languages or other parameters, you'd generate them here
  return [];
}

export default async function Home() {

  const heroSection = await getHeroSection();
  const skillsSection = await getSkillsSection();
  const portfolioSection = await getPortfolioSection();
  const blogSection = await getBlogSection();
  const contactSection = await getContactsSection();



  return (
    <main className="mx-auto md:max-w-7xl mt-10 md:mt-0">

      {!heroSection ? <ErrorDiv>Error loading Header data</ErrorDiv> : <Hero heroSection={heroSection} />}

      {!skillsSection ? <ErrorDiv>Error loading Skills data</ErrorDiv> : <Skills skillsSection={skillsSection} />}

      {!portfolioSection ? <ErrorDiv>Error loading Portfolio data</ErrorDiv> : <PostsSection section={portfolioSection} />}

      {!blogSection ? <ErrorDiv>Error loading Blog data</ErrorDiv> : <PostsSection section={blogSection} />}

      {!contactSection ? <ErrorDiv>Error loading Contacts data</ErrorDiv> : <Contacts contactSection={contactSection} />}

    </main>
  );
}