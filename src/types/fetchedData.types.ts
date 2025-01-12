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

export type PortfolioSection = {
  section_name: string;
  portfolio_posts: PortfolioPost[];
};

export type PortfolioPost = {
  id: number;
  created_at: string;
  title: string;
  image: string;
  source_link: string;
  demo_link: string
  language: string;
  description: string;
  body: string;
  post_type: string;
  portfolio_section: number;
  blurhashURL: string;
  post_tags: PostTag[];
};

export type BlogSection = {
  section_name: string;
  blog_posts: BlogPost[];
};

export type BlogPost = {
  id: number;
  created_at: string;
  title: string;
  image: string;
  source_link: string;
  demo_link: string
  language: string;
  description: string;
  body: string;
  post_type: string;
  blog_section: number;
  blurhashURL: string;
  post_tags: PostTag[];
};

export type PostTag = {
  id: number;
  tag: string;
  post_id: number;
};

export type Contact = {
  id: number;
  label: string;
  icon: string;
  link: string;
  bg_color: string;
};