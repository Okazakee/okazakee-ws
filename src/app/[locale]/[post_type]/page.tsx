import React from 'react';
import { getPosts } from '@/utils/getData';
import { PortfolioPost, BlogPost } from '@/types/fetchedData.types';
import { CircleX } from 'lucide-react';
import PostList from '@/components/common/PostList';
import { getTranslations } from 'next-intl/server';
import { formatLabels } from '@/utils/formatLabels';

export async function generateMetadata({
  params
}: {
  params: Promise<{ post_type: string; locale: string }>
}) {

  const { post_type, locale } = await params;

  const title = post_type.charAt(0).toUpperCase() + post_type.slice(1);

  const tagDesc = locale === 'en' ?
  `My ${post_type} showcasing ${post_type === 'portfolio' ? 'projects i worked on' : 'my thoughts and experiences'}` :
  `Il mio ${post_type} mostra ${post_type === 'portfolio' ? 'progetti a cui ho lavorato' : 'le mie riflessioni ed esperienze'}`;

  return {
    title: `${title} - Okazakee WS`,
    description: tagDesc,
    openGraph: {
      title: `${title} - Okazakee WS`,
      description: tagDesc,
      images: [
        {
          url: 'https://mtvwynyikouqzmhqespl.supabase.co/storage/v1/object/public/website/biography/logo.png',
          width: 1200,
          height: 630,
          alt: 'logo',
        },
      ],
    }
  };
}

export const revalidate = parseInt(process.env.ISR_REVALIDATION as string);

export async function generateStaticParams() {
  return [
    { locale: 'en', post_type: 'portfolio' },
    { locale: 'it', post_type: 'portfolio' },
    { locale: 'en', post_type: 'blog' },
    { locale: 'it', post_type: 'blog' },
  ];
}

export default async function PostsPage({
  params
}: {
  params: Promise<{ post_type: string; locale: string }>
}) {
  const { post_type, locale } = await params;

  const t = await getTranslations('posts-section')

  // Get posts based on the post_type
  const posts = await getPosts(post_type) as PortfolioPost[] | BlogPost[];

  return (
    <section className="md:mt-20 mt-10 flex mx-auto max-w-7xl">
      <div className={`xl:mx-16 text-center mb-20 max-w-[120rem] ${posts.length < 2 && 'h-screen'}`}>
        {posts.length > 0 ? (
          <>
            <h1 className="text-3xl xs:text-4xl xl:text-5xl mb-5">
              {post_type === 'blog' ? t('title2') : t('title1')}
            </h1>
            <h3 className="mb-10 md:mb-10 md:mx-10 mx-5 text-base xs:text-[1.3rem] md:text-2xl" dangerouslySetInnerHTML={{ __html: post_type === 'blog' ?  formatLabels(t('subtitle2')) : formatLabels(t('subtitle1')) }}></h3>
            <PostList initialPosts={posts} post_type={post_type} locale={locale} />
          </>
        ) : (
          <div className='-mt-20 -mb-[7.5rem] h-lvh grid place-content-center text-5xl'>
            <div className='flex items-center'>
              <CircleX size={65} className='stroke-main' />
              <h1 className='ml-5'>{t('no-posts')}</h1>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}