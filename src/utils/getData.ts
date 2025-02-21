import { createClient } from '@supabase/supabase-js'
import { BlogPost, Contact, HeroSection, PortfolioPost, ResumeData, SkillsCategory } from "@/types/fetchedData.types";
import { unstable_cache } from 'next/cache'

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseKey!);

const production = JSON.parse(process.env.UMAMI_ENABLED!);

const revalTime = production ? 86400 : 60;

const timeOfRevalidation = new Date().toISOString();

export const getTranslationsSupabase = unstable_cache(
  async (locale: string) => {
    const { data, error } = await supabase
      .from('i18n_translations')
      .select('translations')
      .eq('language', locale)
      .single();

    // Check if it's specifically a "no rows returned" error
    if (error?.code === 'PGRST116') {
      return null;
    }

    if (error) {
      console.error('Error fetching translations:', error);
      throw error;
    }

    return data?.translations ? data.translations : {};
  },
  ['translations'],
  { revalidate: revalTime, tags: ['translations'] }
);

export const getHeroSection = unstable_cache(
  async (): Promise<HeroSection | null> => {
    const { data, error } = await supabase
      .from('hero_section')
      .select('id, propic, blurhashURL')
      .single();

    // Check if it's specifically a "no rows returned" error
    if (error?.code === 'PGRST116') {
      return null;
    }

    if (error) {
      console.error(error);
      throw error;
    }
    return data;
  },
  ['hero-section'],
  { revalidate: revalTime, tags: ['hero'] }
);

export const getSkillsCategories = unstable_cache(
  async (): Promise<SkillsCategory[] | null> => {
    const { data, error } = await supabase
      .from('skills_categories')
      .select(`
        id,
        name,
        skills (
          id,
          title,
          icon,
          invert,
          category_id,
          blurhashURL
        )
      `);

    if (error) {
      console.error(error);
      throw error;
    }
    return data;
  },
  ['skills-categories'],
  { revalidate: revalTime, tags: ['skills'] }
);

export const getPortfolioPosts = unstable_cache(
  async (): Promise<PortfolioPost[] | null> => {

    let query = supabase
    .from('portfolio_posts')
    .select(`*`)
    .limit(3);

    if (production) {
      query = query.lte('created_at', timeOfRevalidation);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
    return data;
  },
  ['portfolio-posts-recent'],
  { revalidate: revalTime, tags: ['portfolio'] }
);

export const getBlogPosts = unstable_cache(
  async (): Promise<BlogPost[] | null> => {

    let query = supabase
    .from('blog_posts')
    .select(`*`)
    .limit(3);

    if (production) {
      query = query.lte('created_at', timeOfRevalidation);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
    return data;
  },
  ['blog-posts-recent'],
  { revalidate: revalTime, tags: ['blog'] }
);

export const getContacts = unstable_cache(
  async (): Promise<Contact[] | null> => {
    const { data, error } = await supabase
      .from('contacts')
      .select(`*`);

    if (error) {
      console.error(error);
      throw error;
    }
    return data;
  },
  ['contacts'],
  { revalidate: revalTime, tags: ['contacts'] }
);

export const getPosts = unstable_cache(
  async (
    type: string,
    searchQuery?: string,
    locale?: string,
    limit?: number
  ): Promise<BlogPost[] | PortfolioPost[] | null> => {
    const table = type === 'blog' ? 'blog_posts' : 'portfolio_posts';

    let query = supabase
      .from(table)
      .select('*');

    if (production) {
      query = query.lte('created_at', timeOfRevalidation);
    }

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query = query.or(`title_en.ilike.%${searchTerm}%,description_${locale}.ilike.%${searchTerm}%,post_tags.ilike.%${searchTerm}%`);
    }

    if (limit !== undefined) {
      query = query.limit(limit);
    }

    const { data: postsData, error: postsErr } = await query.order('created_at', { ascending: false });

    if (postsErr) {
      console.error('Error fetching posts:', postsErr);
      throw postsErr;
    }
    return postsData;
  },
  ['posts'], // Simple key since the cache will be shared across all getPosts calls
  { revalidate: revalTime, tags: ['posts'] }
);

export const getPost = unstable_cache(
  async (
    id: string,
    type: string
  ): Promise<PortfolioPost | BlogPost | null> => {
    const tableName = type === 'portfolio' ? 'portfolio_posts' : 'blog_posts';

    let query = supabase
    .from(tableName)
    .select(`*`)
    .eq('id', id);

    // Be sure to return unreleased posts only in dev, not in prod
    if (production) {
      query = query.lte('created_at', timeOfRevalidation);
    }

    const { data, error } = await query.single();

    // Check if it's specifically a "no rows returned" error
    if (error?.code === 'PGRST116') {
      return null;
    }


    if (error) {
      console.error(`Error fetching ${type} post:`, error);
      throw error;
    }
    return data;
  },
  ['post'], // Simple key since the cache will be shared across all getPost calls
  { revalidate: revalTime, tags: ['post'] }
);

export const getResumeLink = unstable_cache(
  async (
    locale: string
  ): Promise<string | null> => {
    const { data, error } = await supabase
      .from('hero_section')
      .select('resume_en, resume_it')
      .single();

    // Check if it's specifically a "no rows returned" error
    if (error?.code === 'PGRST116') {
      return null;
    }

    if (error) {
      console.error(`Error fetching resume link:`, error);
      throw error;
    }

    return data[`resume_${locale}` as keyof ResumeData];
  },
  ['resume-link'],
  { revalidate: revalTime, tags: ['resume', 'hero_section'] }
);