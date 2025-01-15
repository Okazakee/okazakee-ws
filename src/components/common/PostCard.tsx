import React from 'react'
import { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import Image from 'next/image';
import Link from 'next/link';
import { Tags } from './Tags';

export default function Postcard({ post, locale } : { post: PortfolioPost | BlogPost; locale: string }) {
  const description = post[`description_${locale}` as keyof typeof post];
  const slugifiedTitle = String(post.title_en).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  const isPortfolioPost = (post: PortfolioPost | BlogPost): post is PortfolioPost => {
    return 'source_link' in post;
  };

  const checkPostType = isPortfolioPost(post) ? 'portfolio' : 'blog';

  return (
    <Link
      href={`/${locale}/${checkPostType}/${post.id}/${slugifiedTitle}`}
      className={`hover:bg-tertiary bg-[#c5c5c5] dark:bg-[#0e0e0e] hover:text-lighttext border-2 p-3 border-secondary rounded-xl overflow-hidden cursor-pointer transition-all text-left flex flex-col justify-between md:w-[32rem] w-full max-w-[21rem] xs:min-w-[24rem] md:max-w-xl hover:scale-105`}
    >
      <div className="w-full h-[11rem] md:h-[15rem] relative mx-auto mb-3">
        <Image
          placeholder='blur'
          blurDataURL={post.blurhashURL}
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
      <div className='flex flex-col'>
        <h1 className="font-bold text-xl xs:text-2xl sm:text-2xl mb-2">{post.title_en}</h1>
        <div className="h-[3rem] mb-2 flex items-center">
          <h2 className="sm:line-clamp-2 line-clamp-3 sm:text-[1.03rem] text-sm leading-4 sm:leading-normal">{description}</h2>
        </div>
        <Tags tags={post.post_tags} />
      </div>
    </Link>
  )
}