import { PortfolioPost } from '@/types/fetchedData.types'
import { getPortfolioPosts, getPortfolioPost } from '@/utils/getData'
import { notFound, redirect } from 'next/navigation'

//TODO MAKE THIS MORE DYNAMIC, [pageType]/[id]/[title], this way blog and portfolio share the same exact structure.

export default async function Page({
  params
}: {
  params: Promise<{ id: string, title: string }>
}) {
  const { id, title } = await params;

  const post: PortfolioPost | null = await getPortfolioPost(id)

  if (!post) {
    notFound()
  }

  // If the provided title doesn't match the actual post title, redirect to the correct URL
  const slugifiedTitle = post.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  if (title !== slugifiedTitle) {
    redirect(`/portfolio/${id}/${slugifiedTitle}`)
  }

  return (
    <section className="md:mx-10 mx-5 flex items-center my-32">
      <div>My Post: {post.title}</div>
    </section>
  )
}

export const revalidate = 3600; // Revalidate every hour

export async function generateStaticParams() {
  const posts = await getPortfolioPosts(100);

  return posts!.map((post: PortfolioPost) => ({
    id: post.id.toString(),
    title: post.title.toLowerCase().replace(/\s+/g, '-'),
  }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const id = (await params).id

  const post: PortfolioPost | null = await getPortfolioPost(id);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
    };
  }

  return {
    title: `${post.title} - Portfolio`,
    description: post.description,
    openGraph: {
      title: `${post.title} - Portfolio`,
      description: post.description,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - Portfolio`,
      description: post.description,
      images: [post.image],
    },
  };
}