import { createClient } from '@supabase/supabase-js'
import { BlogPost, BlogPostTag, BlogSection, ContactSection, HeroSection, PortfolioPost, PortfolioPostTag, PortfolioSection, SkillsSection } from "@/types/fetchedData.types";
import { cache } from 'react'

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseKey!)

export const getHeroSection = cache(async (): Promise<HeroSection | null> => {
  const { data, error } = await supabase
    .from("hero_section")
    .select("*")
    .eq("language", "en");

  if (error) {
    console.error("Error fetching hero section:", error);
    return null;
  }

  return data[0];
})

export const getSkillsSection = cache(async (): Promise<SkillsSection | null> => {
  const { data, error } = await supabase
    .from("skills_section")
    .select(`
      *,
      skills_categories (
        *,
        skills (
          id,
          title,
          icon,
          invert
        )
      )
    `)
    .eq("language", "en");;

  if (error) {
    console.error("Error fetching skills sections:", error);
    return null;
  }

  return data[0];
});

export const getPortfolioSection = cache(async (): Promise<PortfolioSection | null> => {
  const { data, error } = await supabase
    .from("portfolio_section")
    .select(`
      *,
      portfolio_posts (
        id,
        created_at,
        title,
        body,
        image,
        source_link,
        prod_link,
        portfolio_post_tags (
          tag
        )
      )
    `)
    .eq("language", "en")
    .single();

  if (error) {
    console.error("Error fetching portfolio section and posts:", error);
    return null;
  }

  // Fetch the latest 3 posts
  const latestPosts = data.portfolio_posts
    .sort((a: PortfolioPost, b: PortfolioPost) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Format the data with the latest 3 posts including tags
  const portfolioData = {
    ...data,
    portfolio_posts: latestPosts.map((post: PortfolioPost) => ({
      ...post,
      tags: post.portfolio_post_tags.map((tag: PortfolioPostTag) => tag.tag),
    })),
  };

  return portfolioData;
});

export const getBlogSection = cache(async (): Promise<BlogSection | null> => {
  const { data, error } = await supabase
    .from("blog_section")
    .select(`
      *,
      blog_posts (
        id,
        created_at,
        title,
        body,
        image,
        blog_post_tags (
          tag
        )
      )
    `)
    .eq("language", "en")
    .single();

  if (error) {
    console.error("Error fetching blog section and posts:", error);
    return null;
  }

  // Fetch the latest 3 posts
  const latestPosts = data.blog_posts
    .sort((a: BlogPost, b: BlogPost) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);

  // Format the data with the latest 3 posts including tags
  const portfolioData = {
    ...data,
    blog_posts: latestPosts.map((post: BlogPost) => ({
      ...post,
      tags: post.blog_post_tags.map((tag: BlogPostTag) => tag.tag),
    })),
  };

  return portfolioData;
});

export const getContactSection = cache(async (): Promise<ContactSection | null> => {
  const { data, error } = await supabase
    .from("contacts_section")
    .select(`
      *,
      contacts (
        id,
        label,
        icon,
        link
      )
    `)
    .eq("language", "en");

  if (error) {
    console.error("Error fetching contact section:", error);
    return null;
  }

  return data?.[0] ?? null;
});
