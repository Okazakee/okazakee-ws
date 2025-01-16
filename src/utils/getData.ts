import { createClient } from '@supabase/supabase-js'
import { BlogPost, Contact, HeroSection, PortfolioPost, SkillsCategory } from "@/types/fetchedData.types";
import { unstable_cache } from 'next/cache'

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseKey!);

export const getTranslationsSupabase = unstable_cache(
  async (locale: string) => {
    const { data, error } = await supabase
      .from('i18n_translations')
      .select('translations')
      .eq('language', locale)
      .single();

    if (error) {
      console.error('Error fetching translations:', error);
      return {};
    }

    return data?.translations ? data.translations : {};
  },
  ['translations'],
  { revalidate: 3600, tags: ['translations'] }
);

export const getHeroSection = unstable_cache(
  async (): Promise<HeroSection | null> => {
    const { data, error } = await supabase
      .from('hero_section')
      .select('id, propic, blurhashURL')
      .single();

    if (error) {
      console.error(error);
      return null;
    }
    return data;
  },
  ['hero-section'],
  { revalidate: 3600, tags: ['hero'] }
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
      return null;
    }
    return data;
  },
  ['skills-categories'],
  { revalidate: 3600, tags: ['skills'] }
);

export const getPortfolioPosts = unstable_cache(
  async (): Promise<PortfolioPost[] | null> => {
    const { data, error } = await supabase
      .from('portfolio_posts')
      .select(`*`)
      .limit(3)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return null;
    }
    return data;
  },
  ['portfolio-posts-recent'],
  { revalidate: 3600, tags: ['portfolio'] }
);

export const getBlogPosts = unstable_cache(
  async (): Promise<BlogPost[] | null> => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(`*`)
      .limit(3)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
      return null;
    }
    return data;
  },
  ['blog-posts-recent'],
  { revalidate: 3600, tags: ['blog'] }
);

export const getContacts = unstable_cache(
  async (): Promise<Contact[] | null> => {
    const { data, error } = await supabase
      .from('contacts')
      .select(`*`);

    if (error) {
      console.error(error);
      return null;
    }
    return data;
  },
  ['contacts'],
  { revalidate: 3600, tags: ['contacts'] }
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
      .select('*')
      .order('created_at', { ascending: false });

    if (searchQuery) {
      const searchTerm = searchQuery.toLowerCase();
      query = query.or(`title_en.ilike.%${searchTerm}%,description_${locale}.ilike.%${searchTerm}%,post_tags.ilike.%${searchTerm}%`);
    }

    if (limit !== undefined) {
      query = query.limit(limit);
    }

    const { data: postsData, error: postsErr } = await query;

    if (postsErr) {
      console.error('Error fetching posts:', postsErr);
      return null;
    }
    return postsData;
  },
  ['posts'], // Simple key since the cache will be shared across all getPosts calls
  { revalidate: 3600, tags: ['posts'] }
);

export const getPost = unstable_cache(
  async (
    id: string,
    type: string
  ): Promise<PortfolioPost | BlogPost | null> => {
    const tableName = type === 'portfolio' ? 'portfolio_posts' : 'blog_posts';

    const { data, error } = await supabase
      .from(tableName)
      .select(`*`)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching ${type} post:`, error);
      return null;
    }
    return data;
  },
  ['post'], // Simple key since the cache will be shared across all getPost calls
  { revalidate: 3600, tags: ['post'] }
);

export const getResumeLink = unstable_cache(
  async (): Promise<string | null> => {
    const { data, error } = await supabase
      .from('contacts')
      .select('link')
      .eq('label', 'Resume')
      .single();

    if (error) {
      console.error(`Error fetching resume link:`, error);
      return null;
    }
    return data.link;
  },
  ['resume-link'],
  { revalidate: 3600, tags: ['resume', 'contacts'] }
);