import React from "react";
import { BlogPost, BlogSection, PortfolioPost, PortfolioSection } from "@/types/fetchedData.types";
import Link from "next/link";
import Postcard from "../common/Postcard";
import { getTranslations } from "next-intl/server";
import { formatLabels } from "@/utils/formatLabels";

export default async function PostsSection({
  section,
  locale
}: {
  section: BlogSection | PortfolioSection
  locale: string
}) {

  const t = await getTranslations('posts-section');

  const posts = 'blog_posts' in section
    ? section.blog_posts
    : section.portfolio_posts;

    const isBlog = 'blog_posts' in section;

  return (
    <section id={isBlog ? 'blog' : 'portfolio'} className="text-center sm:mx-20 md:mx-auto md:min-h-lvh md:w-full mt-20 md:mt-0 mdh:mt-40">
      <h1 className="xl:text-6xl md:text-5xl text-4xl xs:text-5xl mb-5">{t(isBlog ? 'title2' : 'title1')}</h1>
      <h3 className="mb-10 md:mb-20 text-lg xs:text-[1.4rem] md:text-2xl" dangerouslySetInnerHTML={{ __html: formatLabels(t(isBlog ? 'subtitle2' : 'subtitle1')) }}></h3>
      <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
        {posts.map((post: BlogPost | PortfolioPost) => (
          <Postcard key={post.id} post={post} locale={locale} />
        ))}
      </div>
      {posts.length > 2 &&
        <Link href={isBlog ? `/${locale}/blog` : `/${locale}/portfolio`} className="">
          <button className="mt-10 md:mt-20 bg-secondary hover:bg-tertiary text-lighttext transition-all px-5 py-2 rounded-lg text-xl scale-[85%] sm:scale-100 xs:scale-100">
            {t('button')}
          </button>
        </Link>
      }
    </section>
  );
}