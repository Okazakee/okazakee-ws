import React from "react";
import { Metadata } from "next";
import Contacts from "@components/landing/Contacts";
import Blog from "@components/landing/Blog";
import Portfolio from "@components/landing/Portfolio";
import Skills from "@components/landing/Skills";
import Hero from "@components/landing/Hero";
import { getHeroSection, getSkillsSection, getPortfolioSection, getBlogSection, getContactSection } from "@/utils/getData";

export const metadata: Metadata = {
  title: "Okazakee WS - Home",
  description: "Personal website with portfolio and blog",
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
/*   const blogSection = await getBlogSection();
 */  const contactSection = await getContactSection();



  return (
    <div className="mx-auto max-w-7xl">

      {!heroSection ? <div>Error loading data</div> : <Hero heroSection={heroSection} />}

      {!skillsSection ? <div>Error loading data</div> : <Skills skillsSection={skillsSection} />}

      {!portfolioSection ? <div>Error loading data</div> : <Portfolio portfolioSection={portfolioSection} />}

{/*       {!blogSection ? <div>Error loading data</div> : <Blog blogSection={blogSection} />}
 */}
      {!contactSection ? <div>Error loading data</div> : <Contacts contactSection={contactSection} />}

    </div>
  );
}