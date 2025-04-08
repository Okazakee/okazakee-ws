import React from 'react';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { formatLabels } from '@/utils/formatLabels';
import { getSkillsCategories } from '@/utils/getData';
import { ErrorDiv } from '@components/common/ErrorDiv';

export default async function Skills() {
  const skills_categories = await getSkillsCategories();

  const t = await getTranslations('skills-section');

  return skills_categories ? (
    <section
      id="skills"
      className="flex items-center justify-center text-center mx-5 xl:mx-16 md:min-h-lvh mt-20 md:mt-0 mb-20 md:mb-32 mdh:mt-40"
    >
      <div className="w-full h-full ">
        <h1 className="xl:text-6xl text-3xl xs:text-4xl mb-10 xl:mb-5 ">
          {t('title')}
        </h1>
        <h2
          className="xl:mb-20 text-lg xs:text-[1.4rem] md:text-2xl mb-10"
          dangerouslySetInnerHTML={{ __html: formatLabels(t('subtitle')) }}
        />
        {skills_categories.map((skillCategory, index) => (
          <div key={skillCategory.id} className="">
            <h2 className="text-[1.4rem] xs:text-[1.7rem] md:text-[2.33rem] xs:tracking-wider my-5">
              {t(`skills.${skillCategory.name}`)}
            </h2>
            <div className="flex xl:flex-nowrap flex-wrap justify-center items-center">
              {skillCategory.skills.map((skill, i) => (
                <div
                  key={skill.id}
                  className="md:drop-shadow-3xl drop-shadow-xl dark:drop-shadow-none hover:scale-110 transition-all mx-auto my-5 md:my-10 w-[calc(33.333%-1rem)]"
                >
                  <Image
                    placeholder="blur"
                    blurDataURL={skill.blurhashURL}
                    src={skill.icon}
                    width={80}
                    height={80}
                    sizes="(min-width: 1280px) 80px, (min-width: 475px) 70px, 60px"
                    className={`mx-auto rounded-xl w-[60px] xs:w-[70px] xl:w-[80px] ${skill.invert && 'dark:invert'}`}
                    alt={skill.title}
                  />
                  <h3 className="mt-5 xs:text-xl xl:text-2xl">{skill.title}</h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  ) : (
    <ErrorDiv>Error loading Skills data</ErrorDiv>
  );
}
