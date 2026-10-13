/**
 * Volatile post-metric identities (client-safe, unit-tested).
 *
 * View counts are keyed by `{postType, id}` only — never by locale — so
 * EN and IT resolve to the same authoritative counter.
 */

export type PostViewsType = 'blog' | 'portfolio';

export interface PostViewsKey {
  postType: PostViewsType;
  id: number;
}

/** Locale-independent identity: EN and IT resolve to the same counter. */
export function postViewsMapKey(postType: PostViewsType, id: number): string {
  return `${postType}:${id}`;
}

/** Locale-independent counter map for one batch of visible posts. */
export type PostViewsMap = Record<string, number>;
