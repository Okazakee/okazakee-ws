import { createClient } from '@supabase/supabase-js'
import { BlogSection, ContactSection, HeroSection, PortfolioPost, PortfolioSection, SkillsSection } from "@/types/fetchedData.types";
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
    console.error('Error fetching posts:', error);
    return null;
  }

  const { data: postsData, error: postsErr } = await supabase
    .from('posts')
    .select(`
      *,
      post_tags!inner (*)
    `)
    .eq('language', 'en')
    .eq('post_type', 'portfolio')
    .order('created_at', { ascending: false })
    .limit(3);

  if (postsErr) {
    console.error('Error fetching posts:', postsErr);
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
  const { data, error } = await supabase
    .from('blog_section')
    .select(`
      id, section_name, subtitle, language,
      blog_posts: posts (
        id,
        title,
        image,
        language,
        description,
        body,
        post_type,
        blog_section,
        post_tags: post_tags (
          id,
          tag,
          post_id,
          post_type
        )
      )
    `)
    .eq('language', 'en')
    .single();

  if (error) {
    console.error('Error fetching blog section:', error);
    return null;
  }

  return data;
});

export const getContactSection = cache(async (): Promise<ContactSection | null> => {
  const { data, error } = await supabase
    .from('contacts_section')
    .select(`
      id, section_name, subtitle, language,
      contacts (
        id, label, icon, link
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

export const getAllPortfolioPosts = cache(async (): Promise<PortfolioPost[] | null> => {

  const { data: postsData, error: postsErr } = await supabase
    .from('posts')
    .select(`
      *,
      post_tags (*)
      `)
    .eq('language', 'en')
    .eq('post_type', 'portfolio')
    .order('created_at', { ascending: false });

  if (postsErr) {
    console.error('Error fetching posts:', postsErr);
    return null;
  }

  return postsData;
});

/* export const getAllBlogPosts = cache(async (): Promise<BlogPost[] | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      id, created_at, title, body, image, source_link, prod_link, description, post_type, blog_section,
      post_tags (id, tag)
    `)
    .eq('post_type', 'blog')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return null;
  }
  return data;
}); */