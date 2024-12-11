import React from 'react';
import { getRecentPortfolioPosts } from '@/utils/getData';
import { PortfolioPost } from '@/types/fetchedData.types';
import { CircleX } from 'lucide-react';
import { Metadata } from 'next';
import Postcard from '@/components/common/Postcard';
import Searchbar from '@/components/common/Searchbar';

export const metadata: Metadata = {
  title: "Okazakee WS - Portfolio",
  description: "My portfolio showcasing projects i worked on",
};

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  // This function is empty because we're only generating one page
  // If you had multiple languages or other parameters, you'd generate them here
  return [];
}

export default async function Portfolio() {

  const posts = await getRecentPortfolioPosts() as PortfolioPost[];

  return (
    <section className="mt-24 flex justify-center">
      <div className="xl:mx-16 text-center mb-20">
        {posts.length > 0 ?
        <>
          <div className="text-5xl mb-5">
            Portfolio
          </div>
          <Searchbar />
          <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
            {posts.map((post) => {
              return (
                <Postcard key={post.id} post={post} />
              );
            })}
          </div>
        </>
        :
        <div className='-mt-24 -mb-[7.5rem] h-lvh grid place-content-center text-5xl'>
          <div className='flex items-center'>
            <CircleX size={65} className='stroke-main' />
            <h1 className='ml-5'>There are no posts avaliable!</h1>
          </div>
        </div>
        }
      </div>
    </section>
  );
}