import React from 'react'
import Image from 'next/image'
import { HeroSection } from '@/types/fetchedData.types';

function Hero({ heroSection }: { heroSection: HeroSection }){

  const { propic, name, job_position, section_name, desc } = heroSection;

  return (
    <section className="xl:mx-16 h-svh flex items-center">
        <div>
          <div className="flex flex-col xl:flex-row items-center xl:justify-between">
            <Image
              src={propic}
              width={400}
              height={400}
              className='rounded-2xl xl:mr-10 w-[350px] xl:w-[360px] xl:mx-0 my-20 xl:py-0'
              alt="logo"
            />
            <div className="text-center text-4xl lg:text-6xl">
              <h1 className="xl:mb-10 mb-12" dangerouslySetInnerHTML={{ __html: name }}></h1>
              <h2 dangerouslySetInnerHTML={{ __html: job_position }}></h2>
            </div>
          </div>
          <div className="flex items-center text-center">
            <div>
              <h1 className="xl:text-5xl text-4xl xl:mb-10 mb-10" dangerouslySetInnerHTML={{ __html: section_name }}></h1>
              <p className="xl:text-left text-justify text-2xl lg:text-2xl" dangerouslySetInnerHTML={{ __html: desc }}></p>
            </div>
          </div>
        </div>
      </section>
  )
}

export default Hero