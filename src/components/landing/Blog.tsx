import React from "react";
import Image from "next/image";
import { BlogSection } from "@/types/fetchedData.types";

export default function Blog({
  blogSection
}: {
  blogSection: BlogSection;
}) {
  const { section_name, subtitle, blog_posts } = blogSection;

  return (
    <section id="blog" className="text-center mx-5 xl:mx-16 min-h-lvh mt-32 2xlh:mt-0 transition-all">
      <h1 className="text-6xl mb-5 ">{section_name}</h1>
        <h3 className="mb-20 text-2xl" dangerouslySetInnerHTML={{ __html: subtitle }}>
        </h3>
        {blog_posts.map((post) => {
          return (
            <div key={post.id} className="flex items-center border-2 border-transparent cursor-pointer hover:border-main p-5 rounded-2xl">
              <div className="min-w-[22rem] max-w-[22rem] min-h-[15rem] max-h-[15rem] relative">
                <Image
                  src={post.image}
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
                  {post.body.length > 270 ? post.body.substring(0, 270) + "..." : post.body}
                </p>
                <div className="mt-3">
                {post.blog_post_tags.map((tag) => (
                    <span key={post.id} className="bg-orange-800 text-lighttext rounded-md px-2 py-1.5">{tag.tag}</span>
                  ))}
                </div>
              </div>
            </div>
          )
        })}

<button className="hover:bg-main bg-secondary text-lighttext transition-all px-3 py-1.5 rounded-xl mt-10 text-2xl">
        Explore more...
      </button>
      </section>
  )
};