export type HeroSection = {
  id: number;
  propic: string;
  name: string;
  job_position: string;
  section_name: string;
  desc: string;
  language: string;
};

export type SkillsSection = {
  id: number;
  section_name: string;
  subtitle: string;
  language: string;
  skills_categories: SkillsCategory[]
};

export type SkillsCategory = {
  id: number;
  name: string;
  language: string;
  skills: Skill[];
};

export type Skill = {
  id: number;
  title: string;
  icon: string;
  invert: boolean;
  language: string;
};

export type LandingPageProps = {
  heroSection: HeroSection;
  skillsSections: SkillsSection;
};