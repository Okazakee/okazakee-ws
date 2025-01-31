import React from 'react';
import Image from 'next/image';
import { ErrorDiv } from '../ErrorDiv';
import { useLayoutStore } from '@/store/layoutStore';

export default function HeroSection() {
  const { heroSection } = useLayoutStore();

  if (!heroSection) {
    return <ErrorDiv>Error loading Hero data</ErrorDiv>;
  }

  const { mainImage, blurhashURL, resume_en, resume_it } = heroSection;

  return (
    mainImage &&
    blurhashURL &&
    resume_en &&
    resume_it && (
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
              src={mainImage}
              width={280}
              height={280}
              className="rounded-md border border-main"
              alt="mainImage"
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
    )
  );
}
