import React from 'react'
import Image from 'next/image'
import { HeroSection } from '@/types/fetchedData.types';

function Hero({ heroSection }: { heroSection: HeroSection }){

  const { propic, name, job_position, section_name, desc, blurhashURL } = heroSection;

  return (
    <section className="md:mx-10 mx-5 md:h-svh flex items-center">
        <div>
          <div className="flex flex-col xl:flex-row items-center xl:justify-around">
            <Image
              layout="intrinsic"
              placeholder='blur'
              blurDataURL={blurhashURL}
              src={propic}
              width={400}
              height={400}
              className='rounded-2xl xl:mr-10 w-[300px] xl:w-[340px] xl:mx-0 mb-10 md:mb-20 mt-14 md:mt-20 xl:py-0 border-[3px] border-main'
              alt="logo"
            />
            <div className="text-center text-4xl lg:text-[3.5rem]">
              <h1 className="xl:mb-10 md:mb-12 mb-5" dangerouslySetInnerHTML={{ __html: name }}></h1>
              <h2 dangerouslySetInnerHTML={{ __html: job_position }}></h2>
            </div>
          </div>
          <div className="flex items-center text-center mt-10 md:mt-20">
            <div>
              <h1 className="xl:text-6xl text-4xl mb-10" dangerouslySetInnerHTML={{ __html: section_name }}></h1>
              <p className="text-left text-[1.3rem] tracking-[0.05em] lg:text-2xl" dangerouslySetInnerHTML={{ __html: desc }}></p>
            </div>
          </div>
        </div>
      </section>
  )
}

export default Hero