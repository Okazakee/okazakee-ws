import React from "react";
import { PortfolioSection } from "@/types/fetchedData.types";
import Link from "next/link";
import Postcard from "../common/Postcard";

export default function Portfolio({
  portfolioSection
}: {
  portfolioSection: PortfolioSection;
}) {
  const { section_name, subtitle, portfolio_posts } = portfolioSection;

  return (
    <section id="portfolio" className="text-center mx-5 xl:mx-16 min-h-lvh xl:w-full">
      <h1 className="text-6xl mb-5">{section_name}</h1>
      <h3 className="mb-20 text-2xl" dangerouslySetInnerHTML={{ __html: subtitle }}></h3>

    <div className="flex flex-wrap gap-6 justify-center mx-5 transition-all">
      {portfolio_posts.map((post) => (
        <Postcard key={post.id} post={post} />
      ))}
    </div>

      <Link href={'/portfolio'}>
        <button className="hover:bg-main bg-secondary text-lighttext transition-all px-3 py-1.5 rounded-xl mt-10 text-2xl">
          Explore more...
        </button>
      </Link>
    </section>
  );
}