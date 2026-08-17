'use server';

import { createClient } from '@supabase/supabase-js';
import { publicConfig } from '@/config/public';

const supabase = createClient(
  publicConfig.supabaseUrl,
  publicConfig.supabasePublishableKey
);

export async function getCurrentViews(
  postId: string,
  postType: 'blog' | 'portfolio'
) {
  try {
    const tableName =
      postType === 'portfolio' ? 'portfolio_posts' : 'blog_posts';

    const { data, error } = await supabase
      .from(tableName)
      .select('views')
      .eq('id', postId)
      .single();

    if (error) {
      console.error('Error fetching current views:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      views: data?.views || 0,
    };
  } catch (error) {
    console.error('Error in getCurrentViews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
