import React from 'react'
import { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import Image from 'next/image';
import Link from 'next/link';
import { Tags } from './Tags';

export default function Postcard({ post } : { post: PortfolioPost | BlogPost }) {

  const slugifiedTitle = post.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  return (
    <Link href={`/${post.post_type}/${post.id}/${slugifiedTitle}`}
      className={`hover:bg-tertiary bg-[#c5c5c5] dark:bg-[#0e0e0e] hover:text-lighttext border-2 p-3 border-secondary rounded-xl overflow-hidden cursor-pointer transition-all text-left flex flex-col justify-between md:w-[32rem] w-full min-w-[24rem] max-w-sm md:max-w-xl hover:scale-105`}
    >
      <div className="w-full h-[12rem] md:h-[16rem] relative mx-auto mb-2">
        <Image
          src={post.image}
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          alt="post_image"
          className="rounded-lg"
        />
      </div>
      <div className=''>
        <h3 className="font-bold text-2xl">{post.title}</h3>
        <h2 className="md:truncate tracking-tighter md:tracking-normal text-lg min-h-10 flex items-center justify-start">{post.description}</h2>
        <Tags tags={post.post_tags} />
      </div>
    </Link>
  )
}