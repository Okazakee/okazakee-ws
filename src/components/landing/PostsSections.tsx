import React from "react";
import { BlogPost, BlogSection, PortfolioPost, PortfolioSection } from "@/types/fetchedData.types";
import Link from "next/link";
import Postcard from "../common/Postcard";

export default function PostsSection({
  section
}: {
  section: BlogSection | PortfolioSection
}) {
  const { section_name, subtitle } = section;

  const posts = 'blog_posts' in section
    ? section.blog_posts
    : section.portfolio_posts;

    const isBlog = 'blog_posts' in section;

  return (
    <section id="blog" className="text-center mx-5 sm:mx-20 md:mx-auto md:min-h-lvh md:w-full mt-20 md:mt-0">
      <h1 className="xl:text-6xl md:text-5xl text-4xl mb-5">{section_name}</h1>
      <h3 className="mb-10 md:mb-20 text-[1.3rem] md:text-2xl" dangerouslySetInnerHTML={{ __html: subtitle }}></h3>

    <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
      {posts.map((post: BlogPost | PortfolioPost) => (
        <Postcard key={post.id} post={post} />
      ))}
    </div>

      {posts.length > 2 &&
        <Link href={isBlog ? '/blog' : '/portfolio'}>
          <button className="md:bg-opacity-80 md:hover:bg-opacity-100 bg-main text-lighttext transition-all px-5 py-2 rounded-xl mt-10 text-xl">
            Explore more...
          </button>
        </Link>
      }
    </section>
  );
}