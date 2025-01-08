'use client'

import { BlogPost, PortfolioPost } from '@/types/fetchedData.types'
import React, { useState } from 'react'
import Postcard from './Postcard';
import Searchbar from './Searchbar';
import { ErrorDiv } from './ErrorDiv';

export default function PostList({ initialPosts, post_type } : { initialPosts: PortfolioPost[] | BlogPost[]; post_type: string; }) {
  const [posts, SetPosts] = useState(initialPosts);

  return (
    <>
      <Searchbar post_type={post_type} SetPosts={SetPosts} initialPosts={initialPosts} />

      <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
        {posts.length > 0
        ? posts.map((post) => (
            <Postcard key={post.id} post={post} />
          ))
        : <ErrorDiv>No posts found!</ErrorDiv>
        }
      </div>
    </>
  )
}