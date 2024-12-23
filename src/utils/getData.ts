import { createClient } from '@supabase/supabase-js'
import { BlogPost, BlogSection, ContactSection, HeroSection, PortfolioPost, PortfolioSection, SkillsSection } from "@/types/fetchedData.types";
import { cache } from 'react'

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseKey!)
export const getHeroSection = cache(async (): Promise<HeroSection | null> => {
  const { data, error } = await supabase
    .from('hero_section')
    .select('id, propic, name, job_position, section_name, desc, language')
    .eq('language', 'en')
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
});

export const getSkillsSection = cache(async (): Promise<SkillsSection | null> => {
  const { data, error } = await supabase
    .from('skills_section')
    .select(`
      id, section_name, subtitle, language,
      skills_categories: skills_categories (
        id, name, language, skills_section,
        skills (id, title, icon, invert, category_id)
      )
    `)
    .eq('language', 'en')
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
});

export const getPortfolioSection = cache(async (): Promise<PortfolioSection | null> => {
  const { data: sectionMainData, error } = await supabase
  .from('portfolio_section')
  .select('*')
  .eq('language', 'en')
  .single();

  if (error) {
    console.error('Error fetching portfolio section:', error);
    return null;
  }

  const { data: postsData, error: postsErr } = await supabase
    .from('posts')
    .select(`
      *,
      post_tags (*)
      `)
    .eq('language', 'en')
    .eq('post_type', 'portfolio')
    .order('created_at', { ascending: false })
    .limit(3);

  if (postsErr) {
    console.error('Error fetching portfolio posts:', postsErr);
    return null;
  }

  const sectionData = {
    section_name: sectionMainData.section_name,
    subtitle: sectionMainData.subtitle,
    portfolio_posts: postsData
  }

  return sectionData;
});

export const getBlogSection = cache(async (): Promise<BlogSection | null> => {
  const { data: sectionMainData, error } = await supabase
  .from('blog_section')
  .select('*')
  .eq('language', 'en')
  .single();

  if (error) {
    console.error('Error fetching blog section:', error);
    return null;
  }

  const { data: postsData, error: postsErr } = await supabase
    .from('posts')
    .select(`
      *,
      post_tags (*)
      `)
    .eq('language', 'en')
    .eq('post_type', 'blog')
    .order('created_at', { ascending: false })
    .limit(3);

  if (postsErr) {
    console.error('Error fetching blog posts:', postsErr);
    return null;
  }

  const sectionData = {
    section_name: sectionMainData.section_name as string,
    subtitle: sectionMainData.subtitle as string,
    blog_posts: postsData as BlogPost[]
  }

  return sectionData;
});

export const getContactSection = cache(async (): Promise<ContactSection | null> => {
  const { data, error } = await supabase
    .from('contacts_section')
    .select(`
      id, section_name, subtitle, language,
      contacts (
        *
      )
    `)
    .eq('language', 'en')
    .order('id', { foreignTable: 'contacts' })
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
});

export const getPosts = cache(async ( type: string, limit?: number, lang?: string): Promise<BlogPost[] | PortfolioPost[] | null> => {

  const query = supabase
    .from('posts')
    .select(`
      *,
      post_tags (*)
    `)
    .eq('language', lang || 'en')
    .eq('post_type', type)
    .order('created_at', { ascending: false });

  // Apply limit only if it's defined
  if (limit !== undefined) {
    query.limit(limit);
  }

  const { data: postsData, error: postsErr } = await query;

  if (postsErr) {
    console.error('Error fetching posts:', postsErr);
    return null;
  }

  return postsData;
});

export const getPost = cache(async (id: string, type: string, lang?: string): Promise<PortfolioPost | BlogPost | null> => {

  const { data: postsData, error: postsErr } = await supabase
    .from('posts')
    .select(`
      *,
      post_tags (*)
      `)
    .eq('language', lang || 'en')
    .eq('post_type', type)
    .eq('id', id)
    .order('created_at', { ascending: false });

  if (postsErr) {
    console.error('Error fetching posts:', postsErr);
    return null;
  }

  return postsData[0];
});