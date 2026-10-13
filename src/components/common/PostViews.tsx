'use client';

import { Eye } from 'lucide-react';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getPostViewsBatch } from '@/app/actions/getPostViewsBatch';
import {
  postViewsMapKey,
  type PostViewsKey,
  type PostViewsMap,
  type PostViewsType,
} from '@/utils/postViews';

const PostViewsContext = createContext<PostViewsMap | null>(null);

/**
 * Fetches live view counts for one visible set of posts in ONE batched
 * request. Cards never render ISR-baked numbers (those go stale and
 * disagree across locales); badges show `—` until the live map arrives
 * and keep it on failure. Never touches content-cache invalidation.
 */
export function PostViewsProvider({
  viewKeys,
  children,
}: {
  viewKeys: PostViewsKey[];
  children: ReactNode;
}) {
  const [viewsByKey, setViewsByKey] = useState<PostViewsMap>({});

  // Set identity as a sorted string: stable across rerenders with the
  // same ids, so search/list updates request exactly one new batch.
  const signature = useMemo(() => {
    const keys = new Set<string>();
    for (const key of viewKeys ?? []) {
      if (
        (key?.postType === 'blog' || key?.postType === 'portfolio') &&
        Number.isInteger(key?.id)
      ) {
        keys.add(postViewsMapKey(key.postType, key.id));
      }
    }
    return [...keys].sort().join('|');
  }, [viewKeys]);

  useEffect(() => {
    if (signature === '') return;
    let cancelled = false;
    const keys: PostViewsKey[] = signature.split('|').map((part) => {
      const sep = part.indexOf(':');
      return {
        postType: part.slice(0, sep),
        id: Number(part.slice(sep + 1)),
      } as PostViewsKey;
    });
    getPostViewsBatch(keys)
      .then((result) => {
        if (!cancelled && result.success) setViewsByKey(result.views);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [signature]);

  return (
    <PostViewsContext.Provider value={viewsByKey}>
      {children}
    </PostViewsContext.Provider>
  );
}

/** Live count for one post, or null until loaded / on failure. */
export function usePostViews(
  postType: PostViewsType,
  id: number
): number | null {
  const map = useContext(PostViewsContext);
  if (!map) return null;
  const value = map[postViewsMapKey(postType, id)];
  return typeof value === 'number' ? value : null;
}

/** Card view badge: stable `—` placeholder, never a stale ISR number. */
export function PostViewsBadge({
  postType,
  postId,
}: {
  postType: PostViewsType;
  postId: number;
}) {
  const views = usePostViews(postType, postId);

  return (
    <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-base/85 px-2 py-0.5 font-mono text-[11px] text-text-muted backdrop-blur-surface">
      <Eye className="h-3.5 w-3.5 text-text-dim" />
      {views === null ? '—' : views}
    </span>
  );
}
