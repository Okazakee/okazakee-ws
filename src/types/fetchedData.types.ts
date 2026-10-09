export type HeroSection = {
  id: number;
  propic: string;
  blurhashURL: string;
  /** Portrait preset; null falls back to `pebble` via normalizeHeroShape. */
  shape: string | null;
};

/** Portrait presets the website can render; mirrors the hero_section CHECK. */
export type HeroShape = 'pebble' | 'square' | 'rounded' | 'squircle';

/** The single layout configuration row owned by the CMS. */
export type SiteSettings = {
  /** Theme-specific header images; null keeps each bundled logo. */
  header_logo_dark: string | null;
  header_logo_light: string | null;
  /** Footer VAT number (TEXT, zeroes matter); null renders no VAT. */
  footer_vat_number: string | null;
};

export type SkillsCategory = {
  id: number;
  name: string;
  position: number;
  skills: Skill[];
};

type Skill = {
  id: number;
  title: string;
  icon: string;
  invert: boolean;
  category_id: number;
  blurhashURL: string;
  /** Optional external URL; absent/blank renders a plain tile. */
  link: string | null;
  /** Order inside the category; null sorts last (never ordered). */
  position: number | null;
};

export type PortfolioPost = {
  id: number;
  created_at: string;
  title_en: string;
  title_it: string;
  image: string;
  source_link: string;
  demo_link: string;
  description_en: string;
  description_it: string;
  body_en: string;
  body_it: string;
  blurhashURL: string;
  post_tags: string;
  store_link: string;
  fdroid_link: string | null;
  website: string | null;
  ios_store_link: string | null;
  views: number;
  hidden: boolean;
  author_id?: string;
  /** Ordered quick-link buttons; `unknown` because it is jsonb and parsed by
   * `parsePostButtons`. Absent/null on rows written before the column existed,
   * which is what makes the legacy-column fallback meaningful. */
  buttons?: unknown;
};

export type BlogPost = {
  title: string;
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
  views: number;
  hidden: boolean;
  author_id?: string;
};

export type Contact = {
  id: number;
  position: number;
  label: string;
  icon: string;
  link: string;
  bg_color: string;
};

export type ResumeData = {
  resume_en: string;
  resume_it: string;
};

export type User = {
  id: string;
  role: string;
  email: string;
  propic: string;
};

type RemoteType = 'full' | 'hybrid' | 'onSite';

export type CareerEntry = {
  id: number;
  title: string;
  company: string;
  website_url: string;
  logo: string;
  blurhashURL: string;
  location_en: string;
  location_it: string;
  remote: RemoteType;
  startDate: string;
  endDate: string | null;
  description_en: string;
  description_it: string;
  skills: string;
  company_description_en: string;
  company_description_it: string;
  created_at: string;
};
