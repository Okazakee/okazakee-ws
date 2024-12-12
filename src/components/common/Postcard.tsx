import React from 'react'
import { PortfolioPost } from '@/types/fetchedData.types';
import Image from 'next/image';

export default function Postcard({ post } : { post: PortfolioPost }) {

  return (
    <div
      className={`hover:bg-secondary bg-[#c5c5c5] dark:bg-[#151515] hover:text-lighttext border-2 p-3 border-secondary rounded-xl overflow-hidden cursor-pointer transition-all text-left flex flex-col justify-between md:w-[36rem] w-full hover:scale-[104%]`}
    >
      <div className="w-full h-[16rem] relative mx-auto mb-2">
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
        <h2 className="truncate tracking-normal text-lg">{post.description}</h2>
        <div className="mt-2">
          {post.post_tags.map((tag, i) => (
            <span key={i} className="bg-main text-lighttext rounded-md px-2 py-1.5 mr-2">
              {tag.tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}