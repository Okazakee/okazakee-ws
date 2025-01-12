import { createClient } from '@supabase/supabase-js'
import { BlogPost, BlogSection, Contact, HeroSection, PortfolioPost, PortfolioSection, SkillsCategory } from "@/types/fetchedData.types";
import { cache } from 'react';

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseKey!);

export async function getTranslationsSupabase(locale: string) {
  const { data, error } = await supabase
    .from('i18n_translations')
    .select('translations')
    .eq('language', locale)
    .single();

  if (error) {
    console.error('Error fetching translations:', error);
    return {};
  }

  const translations = data?.translations ? data.translations : {};

  return translations;

}

export const getHeroSection = cache(async (): Promise<HeroSection | null> => {
  const { data, error } = await supabase
    .from('hero_section')
    .select('id, propic, blurhashURL')
    .single();

  if (error) {
    console.error(error);
    return null;
  }
  return data;
});

export const getSkillsCategories = cache(async (): Promise<SkillsCategory[] | null> => {
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
});

export const getPortfolioSection = cache(async (): Promise<PortfolioSection | null> => {
  const { data: sectionMainData, error } = await supabase
  .from('portfolio_section')
  .select('*')
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

export const getContacts = cache(async (): Promise<Contact[] | null> => {
  const { data, error } = await supabase
    .from('contacts')
    .select(`*`);

  if (error) {
    console.error(error);
    return null;
  }
  return data;
});

export const getPosts = cache(async (
  type: string,
  limit?: number,
  lang?: string,
  searchParams?: string
): Promise<BlogPost[] | PortfolioPost[] | null> => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      post_tags (*)
    `)
    .eq('post_type', type)
    .order('created_at', { ascending: false });

  // Apply search if searchParams is present
  if (searchParams) {
    // Convert search parameter to lowercase for case-insensitive search
    const searchTerm = searchParams.toLowerCase();

    // First, fetch post IDs from post_tags that match the search term
    const { data: tagPosts, error: tagPostsErr } = await supabase
      .from('post_tags')
      .select('post_id')
      .ilike('tag', `%${searchTerm}%`);

    if (tagPostsErr) {
      console.error('Error fetching post tags:', tagPostsErr);
      return null;
    }

    const postIds = tagPosts.map(tagPost => tagPost.post_id);

    // Now filter posts based on the search term in title, description, or the fetched post IDs
    query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,id.in.(${postIds.join(',')})`);
  }

  // Apply limit only if it's defined
  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data: postsData, error: postsErr } = await query;

  if (postsErr) {
    console.error('Error fetching posts:', postsErr);
    return null;
  }

  return postsData;
});

export const getPost = cache(async (id: string, type: string): Promise<PortfolioPost | BlogPost | null> => {

  const { data: postsData, error: postsErr } = await supabase
    .from('posts')
    .select(`
      *,
      post_tags (*)
      `)
    .eq('post_type', type)
    .eq('id', id)
    .order('created_at', { ascending: false });

  if (postsErr) {
    console.error('Error fetching posts:', postsErr);
    return null;
  }

  return postsData[0];
});