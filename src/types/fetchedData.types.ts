export type HeroSection = {
  id: number;
  propic: string;
  blurhashURL: string;
};

export type SkillsCategory = {
  id: number;
  name: string;
  skills: Skill[];
};

export type Skill = {
  id: number;
  title: string;
  icon: string;
  invert: boolean;
  category_id: number;
  blurhashURL: string;
};

export type PortfolioPost = {
  id: number;
  created_at: string;
  title_en: string;
  title_it: string;
  image: string;
  source_link: string;
  demo_link: string
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
};

export type BlogPost = {
  title: any;
  id: number;
  created_at: string;
  title_en: string;
  title_it: string;
  image: string;
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
};

export type Contact = {
  id: number;
  label: string;
  icon: string;
  link: string;
  bg_color: string;
};