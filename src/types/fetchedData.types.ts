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

export type PortfolioSection = {
  id: number;
  section_name: string;
  subtitle: string;
  language: string;
  portfolio_posts: PortfolioPost[];
};

export type PortfolioPost = {
  id: number;
  created_at: string;
  title: string;
  body: string;
  image: string;
  source_link: string;
  prod_link: string;
  description: string;
  portfolio_post_tags: PortfolioPostTag[];
};

export type PortfolioPostTag = {
  tag: string;
};
export type BlogSection = {
  id: number;
  section_name: string;
  subtitle: string;
  language: string;
  blog_posts: BlogPost[];
};

export type BlogPost = {
  id: number;
  created_at: string;
  title: string;
  body: string;
  image: string;
  source_link: string;
  prod_link: string;
  description: string;
  blog_post_tags: BlogPostTag[];
};

export type BlogPostTag = {
  tag: string;
};

export type Contact = {
  id: number;
  label: string;
  icon: string;
  link: string;
};

export type ContactSection = {
  id: number;
  section_name: string;
  subtitle: string;
  language: string;
  contacts: Contact[];
};