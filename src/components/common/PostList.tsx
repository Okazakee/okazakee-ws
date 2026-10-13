'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { ErrorDiv } from './ErrorDiv';
import Postcard from './PostCard';
import { PostViewsProvider } from './PostViews';
import Searchbar from './Searchbar';

function postViewsType(
  post: BlogPost | PortfolioPost
): 'blog' | 'portfolio' {
  return 'source_link' in post ? 'portfolio' : 'blog';
}

export default function PostList({
  initialPosts,
  post_type,
  locale,
}: {
  initialPosts: PortfolioPost[] | BlogPost[];
  post_type: string;
  locale: string;
}) {
  const [posts, SetPosts] = useState(initialPosts);
  const [isRateLimited, SetIsRateLimited] = useState(false);

  const t = useTranslations('posts-section');

  // One batched live-count request per visible set: search updates swap
  // the set without ever issuing per-card requests.
  const viewKeys = posts.map((post) => ({
    postType: postViewsType(post),
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
              <Postcard key={post.id} post={post} locale={locale} />
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
