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
    <section id="skills" className="flex items-center justify-center text-center mx-5 xl:mx-16 min-h-lvh mb-32">
      <div className="w-full h-full">
        <h1 className="xl:text-6xl text-4xl mb-10 xl:mb-5">{section_name}</h1>
        <h3 className="xl:mb-20 text-2xl mb-20"
          dangerouslySetInnerHTML={{ __html: subtitle }}
        ></h3>
        {skills_categories.map((skillCategory, index) => (
          <div key={index}>
            <h2 className="text-[2.33rem] my-5">{skillCategory.name}</h2>
            <div className="flex xl:flex-nowrap flex-wrap justify-center items-center">
              {skillCategory.skills.map((skill, i) => (
                <div key={i} className="hover:scale-110 transition-all mx-auto my-10 w-[calc(33.333%-1rem)]">
                  <Image
                    src={skill.icon}
                    width={80}
                    height={80}
                    className={`mx-auto w-[60px] xl:w-[80px] ${skill.invert ? "dark:invert" : ""}`}
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
