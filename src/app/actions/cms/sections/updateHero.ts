'use server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function updateHero(updateData: {
  mainImage?: string;
  blurhashURL?: string;
  resume_en?: string;
  resume_it?: string;
}) {
  const supabase = createServerComponentClient({ cookies });

  try {
    const { data, error } = await supabase
      .from('hero')
      .update(updateData)
      .eq('id', 1)  // Assuming there's only one hero record with id 1
      .select();

    if (error) throw error;

    console.log('Supabase update result:', data);

    return { success: true, data };
  } catch (error) {
    console.error('Error updating hero in Supabase:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}