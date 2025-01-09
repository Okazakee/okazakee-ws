import React from "react";
import Image from "next/image";
import { SkillsSection } from "@/types/fetchedData.types";

export default function Skills({
  skillsSection
}: {
  skillsSection: SkillsSection;
}) {
  const { section_name, subtitle, skills_categories } = skillsSection;

  return (
    <section id="skills" className="flex items-center justify-center text-center mx-5 xl:mx-16 md:min-h-lvh mt-20 md:mt-0 mb-20 md:mb-32 mdh:scale-[90%]">
      <div className="w-full h-full">
        <h1 className="xl:text-6xl text-4xl mb-10 xl:mb-5">{section_name}</h1>
        <h3 className="xl:mb-20 md:text-2xl text-[1.3rem] mb-10"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        ></h3>
        {skills_categories.map((skillCategory, index) => (
          <div key={index} className="">
            <h2 className="text-[1.66rem] md:text-[2.33rem] tracking-wider my-5">{skillCategory.name}</h2>
            <div className="flex xl:flex-nowrap flex-wrap justify-center items-center">
              {skillCategory.skills.map((skill, i) => (
                <div key={i} className="hover:scale-110 transition-all mx-auto my-5 md:my-10 w-[calc(33.333%-1rem)]">
                  <Image
                    layout="intrinsic"
                    placeholder='blur'
                    blurDataURL={skill.blurhashURL}
                    src={skill.icon}
                    width={80}
                    height={80}
                    className={`mx-auto rounded-xl w-[70px] xl:w-[80px] ${skill.invert && "dark:invert"}`}
                    alt={skill.title}
                  />
                  <h3 className="mt-5 text-xl xl:text-2xl">{skill.title}</h3>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
