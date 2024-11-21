import React from 'react'
import Image from 'next/image';

interface Props {
  skillsArray: {
    sectionName: string;
    subtitle: string;
    skillsSectons: {
      category: string;
      skills: {
        invert: boolean;
        icon: string;
        title: string;
      }[]
    }[];
  };
}

export default function Skills({skillsArray: {sectionName, subtitle, skillsSectons}}: Props) {

  return (
    <section id="skills" className="flex items-center justify-center text-center mx-5 xl:mx-16 min-h-lvh mb-32">
        <div className="w-full h-full">
          <h1 className="xl:text-6xl text-4xl mb-10 xl:mb-5">{sectionName}</h1>
          <h3 className="xl:mb-20 text-2xl mb-20" dangerouslySetInnerHTML={{ __html: subtitle }}>
          </h3>
          {skillsSectons.map((skillCategory, index) => (
            <div key={index}>
              <h2 className="text-[2.66rem] my-10">{skillCategory.category}</h2>
              <div key={index} className="flex xl:flex-nowrap flex-wrap justify-center items-center">
                {skillsSectons[index].skills.map((skill, i) => (
                <div key={i} className="mx-auto my-10 w-[calc(33.333%-1rem)]">
                  <Image
                    src={skill.icon}
                    width={80}
                    height={80}
                    className={`mx-auto w-[60px] xl:w-[80px] ${skill.invert && 'dark:invert'}`}
                    alt="stack"
                  />
                  <h3 className="mt-5 text-xl xl:text-2xl">{skill.title}</h3>
                </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
  )
}