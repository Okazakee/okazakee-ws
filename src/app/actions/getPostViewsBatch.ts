'use server';

import { createClient } from '@supabase/supabase-js';
import { publicConfig } from '@/config/public';
import {
  postViewsMapKey,
  type PostViewsKey,
  type PostViewsMap,
  type PostViewsType,
} from '@/utils/postViews';

const supabase = createClient(
  publicConfig.supabaseUrl,
  publicConfig.supabasePublishableKey,
  { db: { schema: publicConfig.supabaseSchema } }
);

export type GetPostViewsBatchResult =
  | { success: true; views: PostViewsMap }
  | { success: false; error: string };

/** Upper bound on keys per batch, so one request cannot page a table. */
const MAX_BATCH_KEYS = 200;

type ViewsRow = {
  id: number;
  views: number | null;
};

/**
 * Reads live view counts for every visible `{postType, postId}` pair in
 * ONE request (two indexed SELECTs at most: one per table).
 *
 * Volatile metrics only: published rows, no content-cache interaction —
 * this action never calls the CMS revalidation endpoint and never
 * invalidates `posts`, `blog`, `portfolio` or post-detail tags. Unknown
 * ids fail safe to absence (callers keep the `—` placeholder).
 */
export async function getPostViewsBatch(
  keys: PostViewsKey[]
): Promise<GetPostViewsBatchResult> {
  try {
    const seen = new Set<string>();
    const blogIds: number[] = [];
    const portfolioIds: number[] = [];
    for (const key of keys ?? []) {
      if (key?.postType !== 'blog' && key?.postType !== 'portfolio') {
        continue;
      }
      if (!Number.isInteger(key?.id)) continue;
      const mapKey = postViewsMapKey(key.postType, key.id);
      if (seen.has(mapKey)) continue;
      seen.add(mapKey);
      if (key.postType === 'blog') blogIds.push(key.id);
      else portfolioIds.push(key.id);
      if (seen.size >= MAX_BATCH_KEYS) break;
    }

    if (seen.size === 0) {
      return { success: true, views: {} };
    }

    const scopes: { type: PostViewsType; ids: number[] }[] = [];
    if (blogIds.length > 0) scopes.push({ type: 'blog', ids: blogIds });
    if (portfolioIds.length > 0) {
      scopes.push({ type: 'portfolio', ids: portfolioIds });
    }

    const views: PostViewsMap = {};
    const results = await Promise.all(
      scopes.map(async ({ type, ids }) => {
        const table = type === 'blog' ? 'blog_posts' : 'portfolio_posts';
        const { data, error } = await supabase
          .from(table)
          .select('id,views')
          .in('id', ids)
          .eq('hidden', false);
        return { type, data: (data ?? []) as ViewsRow[], error };
      })
    );

    for (const { type, data, error } of results) {
      if (error) {
        console.error('Error fetching batched views:', error);
        return { success: false, error: error.message };
      }
      for (const row of data) {
        if (Number.isInteger(row?.id)) {
          views[postViewsMapKey(type, row.id)] =
            typeof row.views === 'number' ? row.views : 0;
        }
      }
    }

    return { success: true, views };
  } catch (error) {
    console.error('Error in getPostViewsBatch:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
