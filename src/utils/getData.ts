import { createClient } from '@supabase/supabase-js'
import { HeroSection, SkillsSection, LandingPageProps, SkillsCategory } from "@/types/fetchedData.types";
import { cache } from 'react'

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_ANON_KEY as string;

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseKey!)

export const getHeroSection = cache(async (): Promise<HeroSection | null> => {
  const { data, error } = await supabase
    .from("hero_section")
    .select("*")
    .eq("language", "it");

  if (error) {
    console.error("Error fetching hero section:", error);
    return null;
  }

  return data[0];
})

export const getSkillsSections = cache(async (): Promise<SkillsSection | null> => {
  const { data, error } = await supabase
    .from("skills_section")
    .select('*');

  if (error) {
    console.error("Error fetching skills sections:", error);
    return null;
  }

  return data[0];
})

export const getSkillsCategories = cache(async (): Promise<SkillsCategory[] | null> => {
  const { data, error } = await supabase
    .from("skills_categories")
    .select(`
      *,
      skills (
        id,
        title,
        icon,
        invert
      )
    `);

  if (error) {
    console.error("Error fetching skills categories:", error);
    return null;
  }

  return data;
});
