import React from 'react'
import { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import Image from 'next/image';

export default function Postcard({ post } : { post: PortfolioPost | BlogPost }) {

  return (
    <div
      className={`hover:bg-secondary bg-[#c5c5c5] dark:bg-[#0e0e0e] hover:text-lighttext border-2 p-3 border-secondary rounded-xl overflow-hidden cursor-pointer transition-all text-left flex flex-col justify-between md:w-[32rem] w-full hover:scale-105`}
    >
      <div className="w-full h-[10rem] md:h-[14rem] relative mx-auto mb-2">
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
        <div className="mt-2">
          { post.post_tags.map((tag, i) => (
            <span key={i} className="bg-main text-lighttext rounded-md px-2 py-1.5 mr-2">
              {tag.tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}