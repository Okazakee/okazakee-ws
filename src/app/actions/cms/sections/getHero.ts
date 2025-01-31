'use server';

import { getHeroSection, getResumeLink } from '@/utils/getData';

export async function getHero() {
  const heroSection = await getHeroSection();
  const resumes = await getResumeLink();

  if (!heroSection || !resumes) {
    throw new Error('Failed to fetch hero section data');
  }

  const hero = {
    mainImage: heroSection.propic,
    blurhashURL: heroSection.blurhashURL,
    resume_en: resumes.resume_en,
    resume_it: resumes.resume_it,
  };

  return hero;
}
