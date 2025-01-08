'use client'

import { BlogPost, PortfolioPost } from '@/types/fetchedData.types'
import React, { useState } from 'react'
import Postcard from './Postcard';
import Searchbar from './Searchbar';
import { ErrorDiv } from './ErrorDiv';

export default function PostList({ initialPosts, post_type } : { initialPosts: PortfolioPost[] | BlogPost[]; post_type: string; }) {
  const [posts, SetPosts] = useState(initialPosts);
  const [isRateLimited, SetIsRateLimited] = useState(false);

  return (
    <>
      <Searchbar post_type={post_type} SetPosts={SetPosts} initialPosts={initialPosts} SetIsRateLimited={SetIsRateLimited} />

      <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
        {posts.length > 0
        ? posts.map((post) => (
            <Postcard key={post.id} post={post} />
          ))
        : isRateLimited ? <ErrorDiv>Too many requests! Please wait and retry.</ErrorDiv> : <ErrorDiv>No posts found!</ErrorDiv>
        }
      </div>
    </>
  )
}