import React from "react";
import Contacts from "@components/landing/Contacts";
import Blog from "@components/landing/Blog";
import Portfolio from "@components/landing/Portfolio";
import Skills from "@components/landing/Skills";
import Hero from "@components/landing/Hero";
import { getHeroSection, getSkillsSections } from "@/utils/getData";

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // This function is empty because we're only generating one page
  // If you had multiple languages or other parameters, you'd generate them here
  return [];
}

export default async function Home() {

  const heroSection = await getHeroSection();
  const skillsSections = await getSkillsSections();

  if (!heroSection || !skillsSections) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="mx-auto max-w-7xl">

      <Hero heroSection={heroSection} />

     <Skills skillsSection={skillsSections} />

      {/*  <Portfolio portfolioArray={portfolioArray[0]} />

      <Blog blogArray={blogArray[0]} />

      <Contacts contactsArray={contactsArray[0]} /> */}

    </div>
  );
}