import React from 'react';
import { getPosts, getBlogSection, getPortfolioSection } from '@/utils/getData';
import { PortfolioPost, BlogPost, BlogSection, PortfolioSection } from '@/types/fetchedData.types';
import { CircleX } from 'lucide-react';
import PostList from '@/components/common/PostList';

export async function generateMetadata({
  params
}: {
  params: Promise<{ post_type: string }>
}) {

  const { post_type } = await params;

  const title = post_type.charAt(0).toUpperCase() + post_type.slice(1);

  return {
    title: `${title} - Okazakee WS`,
    description: `My ${post_type} showcasing ${post_type === 'portfolio' ? 'projects i worked on' : 'my thoughts and experiences'}`,
    openGraph: {
      title: `${title} - Okazakee WS`,
      description: `My ${post_type} showcasing ${post_type === 'portfolio' ? 'projects i worked on' : 'my thoughts and experiences'}`,
      images: [
        {
          url: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/logo.png',
          width: 1200,
          height: 630,
          alt: 'logo',
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - Okazakee WS`,
      description: `My ${post_type} showcasing ${post_type === 'portfolio' ? 'projects i worked on' : 'my thoughts and experiences'}`,
      images: ['https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/logo.png'],
    },
  };
}

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  return [
    { post_type: 'portfolio' },
    { post_type: 'blog' },
  ];
}

export default async function PostsPage({
  params
}: {
  params: Promise<{ post_type: string }>
}) {
  const { post_type } = await params;

  const BlogSection = await getBlogSection() as BlogSection;
  const PortfolioSection = await getPortfolioSection() as PortfolioSection;

  const {subtitle: blogSubtitle, section_name: blogTitle} = BlogSection;
  const {subtitle: portfolioSubtitle, section_name: portfolioTitle} = PortfolioSection;

  // Get posts based on the post_type
  const posts = await getPosts(post_type) as PortfolioPost[] | BlogPost[];

  return (
    <section className="md:mt-20 mt-10 flex justify-center">
      <div className="xl:mx-16 text-center mb-20 max-w-[120rem]">
        {posts.length > 0 ? (
          <>
            <h1 className="text-5xl mb-5">
              {post_type === blogTitle.toLowerCase() ? blogTitle : portfolioTitle}
            </h1>
            <h3 className="mb-10 md:mb-10 md:mx-10 mx-5 text-[1.3rem] md:text-2xl" dangerouslySetInnerHTML={{ __html: post_type === blogTitle.toLowerCase() ? blogSubtitle : portfolioSubtitle }}></h3>
            <PostList initialPosts={posts} post_type={post_type} />
            <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
            </div>
          </>
        ) : (
          <div className='-mt-20 -mb-[7.5rem] h-lvh grid place-content-center text-5xl'>
            <div className='flex items-center'>
              <CircleX size={65} className='stroke-main' />
              <h1 className='ml-5'>There are no posts available!</h1>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}