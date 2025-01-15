import React from 'react'
import { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import Image from 'next/image';
import Link from 'next/link';
import { Tags } from './Tags';
import DescriptionCarousel from '../atoms/DescriptionCarousel';

export default function Postcard({ post, locale } : { post: PortfolioPost | BlogPost; locale: string }) {

  const description = post[`description_${locale}` as keyof typeof post];

  const slugifiedTitle = String(post.title_en).toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');

  const isPortfolioPost = (post: PortfolioPost | BlogPost): post is PortfolioPost => {
    return 'source_link' in post;
  };

  const checkPostType = isPortfolioPost(post) ? 'portfolio' : 'blog';

  return (
    <Link href={`/${locale}/${checkPostType}/${post.id}/${slugifiedTitle}`}
      className={`hover:bg-tertiary bg-[#c5c5c5] dark:bg-[#0e0e0e] hover:text-lighttext border-2 p-3 border-secondary rounded-xl overflow-hidden cursor-pointer transition-all text-left flex flex-col justify-between md:w-[32rem] w-full max-w-[21rem] xs:min-w-[24rem] md:max-w-xl hover:scale-105`}
    >
      <div className="w-full h-[12rem] md:h-[16rem] relative mx-auto mb-3">
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
      <div className=''>
        <h3 className="font-bold text-xl xs:text-2xl sm:text-2xl">{post.title_en}</h3>
        <DescriptionCarousel>{description}</DescriptionCarousel>
        <Tags tags={post.post_tags} />
      </div>
    </Link>
  )
}