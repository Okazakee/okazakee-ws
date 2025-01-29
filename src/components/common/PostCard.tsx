import React from 'react';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import Image from 'next/image';
import Link from 'next/link';
import { Tags } from './Tags';

export default function Postcard({
  post,
  locale,
}: { post: PortfolioPost | BlogPost; locale: string }) {
  const isPortfolioPost = (
    post: PortfolioPost | BlogPost
  ): post is PortfolioPost => {
    return 'source_link' in post;
  };
  const checkPostType = isPortfolioPost(post) ? 'portfolio' : 'blog';

  const description = post[`description_${locale}` as keyof typeof post];

  const initTitle =
    checkPostType === 'portfolio'
      ? post.title_en
      : post[`title_${locale}` as keyof typeof post];

  const slugifiedTitle = String(initTitle)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  const href = `/${locale}/${checkPostType}/${post.id}/${slugifiedTitle}`;

  return (
    <Link
      href={href}
      className="hover:bg-tertiary bg-[#c5c5c5] dark:bg-[#0e0e0e] drop-shadow-2xl dark:drop-shadow-none hover:text-lighttext border-2 p-3 border-secondary rounded-xl overflow-hidden cursor-pointer transition-all text-left flex flex-col justify-between md:w-[32rem] w-full max-w-[21rem] xs:min-w-[24rem] md:max-w-xl hover:scale-105"
    >
      <div className="w-full h-[11rem] md:h-[15rem] relative mx-auto mb-3">
        <Image
          placeholder="blur"
          blurDataURL={post.blurhashURL}
          src={post.image}
          fill
          sizes="100vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          alt="post_image"
          className="rounded-lg"
        />
      </div>
      <div className="flex flex-col">
        <h1 className="font-bold text-xl xs:text-2xl sm:text-2xl mb-2">
          {initTitle}
        </h1>
        <div className="h-[3rem] mb-2 flex items-center">
          <h2 className="sm:line-clamp-2 line-clamp-3 sm:text-[1.03rem] text-sm leading-4 sm:leading-normal tracking-wide sm:tracking-tight">
            {description}
          </h2>
        </div>
        <Tags tags={post.post_tags} />
      </div>
    </Link>
  );
}
