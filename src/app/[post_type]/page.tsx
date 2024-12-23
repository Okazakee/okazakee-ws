import React from 'react';
import { getPosts } from '@/utils/getData';
import { PortfolioPost, BlogPost } from '@/types/fetchedData.types';
import { CircleX } from 'lucide-react';
import Postcard from '@/components/common/Postcard';
import Searchbar from '@/components/common/Searchbar';

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

  // Get posts based on the post_type
  const posts = await getPosts(post_type) as PortfolioPost[] | BlogPost[];

  const title = post_type.charAt(0).toUpperCase() + post_type.slice(1);

  return (
    <section className="mt-24 flex justify-center">
      <div className="xl:mx-16 text-center mb-20 max-w-[120rem]">
        {posts.length > 0 ? (
          <>
            <div className="text-5xl mb-5">
              {title}
            </div>
            <Searchbar posts={posts} />
            <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
              {posts.map((post) => (
                <Postcard key={post.id} post={post} />
              ))}
            </div>
          </>
        ) : (
          <div className='-mt-24 -mb-[7.5rem] h-lvh grid place-content-center text-5xl'>
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