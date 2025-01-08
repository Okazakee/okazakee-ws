'use server'

import { getPosts } from '@/utils/getData'
import { checkRateLimit } from '@/libs/rateLimiters'

export async function searchPosts(
  post_type: string,
  searchQuery: string,
) {

  try {
    const posts = await getPosts(post_type, undefined, undefined, searchQuery);
    return { posts };
  } catch (error) {
    console.error('Search error:', error);
    return { error: 'An error occurred while searching' };
  }
}