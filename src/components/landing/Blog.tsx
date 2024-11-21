import React from 'react';
import Image from 'next/image';

interface Props {
  blogArray: {
    sectionName: string;
    subtitle: string;
    latestPosts: {
      id: number;
      title: string;
      desc: string;
      imageLink: string;
    }[];
  };
}

export default function Blog({ blogArray: { sectionName, subtitle, latestPosts } }: Props) {
  return (
    <section id="blog" className="text-center mx-5 xl:mx-16 min-h-lvh">
      <h1 className="text-6xl mb-5 ">{sectionName}</h1>
        <h3 className="mb-20 text-2xl" dangerouslySetInnerHTML={{ __html: subtitle }}>
        </h3>
        {latestPosts.map((post) => {
          return (
            <div key={post.id} className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl">
              <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
                <Image
                  src={post.imageLink}
                  fill
                  className='rounded-2xl'
                  alt="logo"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center',
                  }}
                />
              </div>
              <div className="flex-col">
                <h2 className="mb-2 text-4xl text-main">{post.title}</h2>
                <p className="text-left text-5xl lg:text-[1.33rem] lg:leading-6 ml-10">
                  {post.desc}
                </p>
              </div>
            </div>
          )
        })}

        <button className="hover:bg-main bg-[#533197] text-lighttext transition-all px-6 py-3 rounded-xl mt-10 text-2xl">Explore more...</button>
      </section>
  )
};