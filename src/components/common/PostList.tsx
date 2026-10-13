'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { PostCardData } from '@/types/fetchedData.types';
import { ErrorDiv } from './ErrorDiv';
import Postcard from './PostCard';
import { PostViewsProvider } from './PostViews';
import Searchbar from './Searchbar';

export default function PostList({
  initialPosts,
  post_type,
  locale,
}: {
  initialPosts: PostCardData[];
  post_type: string;
  locale: string;
}) {
  const [posts, SetPosts] = useState(initialPosts);
  const [isRateLimited, SetIsRateLimited] = useState(false);

  const t = useTranslations('posts-section');
  // The whole list is one type; cards take it explicitly instead of
  // probing for legacy link columns the projection no longer carries.
  const postType: 'blog' | 'portfolio' =
    post_type === 'portfolio' ? 'portfolio' : 'blog';

  const viewKeys = posts.map((post) => ({
    postType,
    id: post.id,
  }));

  return (
    <>
      <Searchbar
        post_type={post_type}
        SetPosts={SetPosts}
        initialPosts={initialPosts}
        SetIsRateLimited={SetIsRateLimited}
        locale={locale}
      />

      <PostViewsProvider viewKeys={viewKeys}>
        <div className="space-y-6">
          {posts.length > 0 ? (
            posts.map((post) => (
              <Postcard
                key={post.id}
                post={post}
                postType={postType}
                locale={locale}
              />
            ))
          ) : isRateLimited ? (
            <ErrorDiv>{t('ratelimit')}</ErrorDiv>
          ) : (
            <ErrorDiv>{t('no-posts')}</ErrorDiv>
          )}
        </div>
      </PostViewsProvider>
    </>
  );
}
