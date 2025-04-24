'use server';
import { createClient } from '@/utils/supabase/server';

export async function updateHero(updateData: {
  mainImage?: string;
  blurhashURL?: string;
  resume_en?: string;
  resume_it?: string;
}) {
  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('hero_section')
      .update(updateData) // Use the dynamic updateData
      .eq('id', 1)
      .select()

    if (error) throw error; // Throw the error if it exists

    return { success: true, data };
  } catch (error) {
    // Log the entire error object for debugging
    console.error('Error updating hero in Supabase:', error);

    // Provide a fallback error message
    return {
      success: false,
      error: error || 'An unknown error occurred'
    };
  }
}