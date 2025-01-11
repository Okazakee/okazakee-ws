import React from 'react'
import Image from 'next/image'
import { HeroSection } from '@/types/fetchedData.types';
import { getTranslations } from 'next-intl/server';
import { formatLabels } from '@/utils/getData';

async function Hero({ heroSection }: { heroSection: HeroSection }){

  const { propic, name, job_position, blurhashURL } = heroSection;

  const t = await getTranslations('hero.aboutme');

  console.log()

  return (
    <section className="md:mx-10 mx-5 md:h-svh flex items-center mdh:mt-20">
        <div>
          <div className="flex flex-col xl:flex-row items-center xl:justify-around">
            <Image
              placeholder='blur'
              blurDataURL={blurhashURL}
              src={propic}
              width={340}
              height={340}
              className='rounded-2xl xl:mr-10 w-[230px] xs:w-[250px] xl:w-[340px] xl:mx-0 mb-10 md:mb-20 mt-14 md:mt-20 xl:py-0 border-[3px] border-main'
              alt="logo"
            />
            <div className="text-center text-3xl xs:text-4xl lg:text-[3.5rem]">
              <h1 className="xl:mb-10 md:mb-12 mb-5" dangerouslySetInnerHTML={{ __html: name }}></h1>
              <h2 dangerouslySetInnerHTML={{ __html: job_position }}></h2>
            </div>
          </div>
          <div className="flex items-center text-center mt-10 md:mt-20">
            <div>
              <h1 className="xl:text-6xl text-3xl xs:text-4xl mb-10" dangerouslySetInnerHTML={{ __html: t('title') }}></h1>
              <p className="text-left  xs:text-[1.4rem] tracking-[0.02em] xs:leading-snug md:leading-normal lg:text-2xl" dangerouslySetInnerHTML={{ __html: formatLabels(t('paragraph')) }}></p>
            </div>
          </div>
        </div>
      </section>
  )
}

export default Hero