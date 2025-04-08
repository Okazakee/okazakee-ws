import React from 'react';
import Image from 'next/image';
import { getHeroSection, getResumeLink } from '@/utils/getData';
import { ErrorDiv } from '../ErrorDiv';

export default async function SkillsSection() {
  const heroSection = await getHeroSection();

  const resumes = await getResumeLink();

  if (!heroSection || !resumes)
    return <ErrorDiv>Error loading Hero data</ErrorDiv>;

  const { propic, blurhashURL } = heroSection;

  const { resume_en, resume_it } = resumes;

  return (
    <section className="mx-5 text-xl w-full flex flex-col gap-10">
      <h1 className="text-2xl">
        Here you can edit Hero Section data to show on the website
      </h1>
      <div className="flex-col items-center">
        <div className="flex items-center gap-5">
          <h2>Hero image:</h2>
          <Image
            placeholder="blur"
            blurDataURL={blurhashURL}
            src={propic}
            width={280}
            height={280}
            className=" rounded-md border border-main"
            alt="propic"
          />
        </div>
        <label className="mt-10 flex text-lighttext gap-5">
          BlurhashURL
          <input
            className="text-darktext w-[50rem] rounded-md"
            type="text"
            placeholder="blurhashURL"
            value={blurhashURL}
          />
        </label>
      </div>
      <div className="flex flex-col gap-4">
        <h2>Resume links:</h2>
        <label className="flex text-lighttext gap-5">
          Resume IT
          <input
            className="text-darktext w-[50rem] rounded-md"
            type="text"
            placeholder="Resume IT"
            value={resume_it}
          />
        </label>
        <label className="flex text-lighttext gap-5">
          Resume EN
          <input
            className="text-darktext w-[50rem] rounded-md"
            type="text"
            placeholder="Resume EN"
            value={resume_en}
          />
        </label>
      </div>
    </section>
  );
}
