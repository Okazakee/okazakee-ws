import { cacheTags } from '@/libs/content/cacheTags';

/**
 * Card/list/search projection: every field `PostCard`, the sitemap and
 * static params render — id and titles for links, descriptions and tags
 * for the card body, image plus blur placeholder for the cover, and
 * `created_at` for sitemap freshness. Bodies, `views`, `hidden`,
 * author linkage, buttons and legacy link columns are detail-only (or
 * metric-owned) and never travel in list payloads.
 */
export const POST_CARD_COLUMNS =
  'id,title_en,title_it,description_en,description_it,image,blurhashURL,post_tags,created_at';

/**
 * Shared detail projection: everything the detail page and its metadata
 * consume from either table. `views` is deliberately absent — live
 * metrics own it — as are `hidden` (filter-only) and the legacy `title`
 * column (nothing renders it). Portfolio-only columns live in
 * `POST_DETAIL_PORTFOLIO_COLUMNS`: `blog_posts` has no such columns.
 */
export const POST_DETAIL_COLUMNS =
  'id,created_at,title_en,title_it,description_en,description_it,body_en,body_it,image,blurhashURL,post_tags,author_id';

/** Detail projection for `portfolio_posts` (buttons + legacy links). Kept
 * as one literal string (not built by concatenation) because the
 * Supabase client parses select strings at the type level. The contract
 * test pins the shared-subset relationship with `POST_DETAIL_COLUMNS`. */
export const POST_DETAIL_PORTFOLIO_COLUMNS =
  'id,created_at,title_en,title_it,description_en,description_it,body_en,body_it,image,blurhashURL,post_tags,author_id,buttons,website,source_link,demo_link,store_link,fdroid_link,ios_store_link';

/**
 * Cache tags for a post list of the given type. Entity-only for known
 * types: the CMS emits the entity tag on every blog/portfolio mutation
 * (create/update/publish/unpublish/delete — verified against
 * `getContentInvalidation`), so cross-type publishes no longer bust
 * these lists. Unknown types keep the shared `posts` tag.
 */
export function postListCacheTags(postType: string): string[] {
  if (postType === 'portfolio') return [cacheTags.portfolio];
  if (postType === 'blog') return [cacheTags.blog];
  return [cacheTags.posts];
}
