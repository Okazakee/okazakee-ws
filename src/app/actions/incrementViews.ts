'use server';

import { headers } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { publicConfig } from '@/config/public';

const supabase = createClient(
  publicConfig.supabaseUrl,
  publicConfig.supabasePublishableKey,
  { db: { schema: publicConfig.supabaseSchema } }
);

export type IncrementViewsResult =
  | { success: true; views?: number; message?: string }
  | { success: false; error: string };

function asCount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    return Number(value);
  }
  return undefined;
}

/**
 * Counts one view for a post and returns the authoritative total.
 *
 * At most one increment per browser/post/24h is enforced by the caller
 * (ViewDisplay, via localStorage); this action only guards the id shape
 * and skips beta/localhost hosts. It never touches content-cache
 * invalidation: view counts are volatile metrics, not editorial content.
 *
 * The increment RPCs are being migrated to return the new count
 * atomically; until that migration lands they return void and the count
 * is read back with one follow-up SELECT (previous behaviour).
 */
export async function incrementViews(
  postId: string,
  postType: 'blog' | 'portfolio'
): Promise<IncrementViewsResult> {
  try {
    const numericId = Number(postId);
    if (!Number.isInteger(numericId)) {
      return { success: false, error: 'Invalid post id' };
    }

    // Get the host header to check if it's a beta domain
    const headersList = await headers();
    const host = headersList.get('host');

    // Don't count views from beta domains or localhost
    if (host?.includes('beta.') || host?.includes('localhost')) {
      return { success: true, message: 'View not counted (beta/localhost)' };
    }

    const tableName =
      postType === 'portfolio' ? 'portfolio_posts' : 'blog_posts';
    const functionName =
      postType === 'portfolio'
        ? 'increment_portfolio_post_views_bigint'
        : 'increment_blog_post_views_bigint';

    const { data, error } = await supabase.rpc(functionName, {
      p_id: numericId,
    });

    if (error) {
      console.error('Error calling increment function:', error);
      return { success: false, error: error.message };
    }

    const authoritative = asCount(data);
    if (authoritative !== undefined) {
      return { success: true, views: authoritative };
    }

    // Pre-migration fallback: current RPCs return void, so read the count
    // back. The caller falls back to getCurrentViews when this is absent.
    const { data: row, error: readError } = await supabase
      .from(tableName)
      .select('views')
      .eq('id', postId)
      .single();

    if (readError) {
      console.error('Error reading views after increment:', readError);
      return { success: true };
    }

    const fallback = asCount(row?.views);
    return fallback === undefined
      ? { success: true }
      : { success: true, views: fallback };
  } catch (error) {
    console.error('Error in incrementViews:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
