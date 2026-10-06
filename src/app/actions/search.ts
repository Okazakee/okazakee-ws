'use server';

import { headers } from 'next/headers';
import { MAX_SEARCH_RESULTS } from '@/config/search';
import { clientKeyFromHeaders } from '@/libs/clientKey';
import { normalizeSearchTerm } from '@/libs/search/query';
import { searchThrottle } from '@/libs/search/rateLimit';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { searchPostsData } from '@/utils/getData';

export type SearchPostsResult =
  | { posts: BlogPost[] | PortfolioPost[]; rateLimited?: false }
  | { posts: []; rateLimited: true }
  | { error: string };

/**
 * Public post search: validate first (no budget spent, no DB hit), then the
 * per-IP throttle, then the query. Invalid input answers empty; a spent
 * budget answers empty plus `rateLimited` so the list can show its retry
 * message instead of "no posts".
 */
export async function searchPosts(
  post_type: string,
  searchQuery: string,
  locale: string
): Promise<SearchPostsResult> {
  const type =
    post_type === 'blog' || post_type === 'portfolio' ? post_type : null;
  const normalizedLocale = locale === 'it' ? 'it' : 'en';
  const term = normalizeSearchTerm(searchQuery);
  if (type === null || term === null) {
    return { posts: [] };
  }

  if (!searchThrottle.allow(clientKeyFromHeaders(await headers()))) {
    return { posts: [], rateLimited: true };
  }

  try {
    const posts = await searchPostsData(
      type,
      term,
      normalizedLocale,
      MAX_SEARCH_RESULTS
    );
    return { posts: posts ?? [] };
  } catch (error) {
    console.error('Search error:', error);
    return { error: 'An error occurred while searching' };
  }
}
