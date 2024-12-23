import { BlogPost, PortfolioPost } from '@/types/fetchedData.types'
import { getPosts, getPost } from '@/utils/getData'
import { notFound, redirect } from 'next/navigation'

export default async function Page({
  params
}: {
  params: Promise<{ post_type: string, id: string, title: string }>
}) {
  const { id, title, post_type } = await params;

  const post: PortfolioPost | BlogPost | null = await getPost(id, post_type)

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
  // Get both types of posts
  const portfolioPosts = await getPosts('portfolio', 100) as PortfolioPost[];
  const blogPosts = await getPosts('blog', 100) as BlogPost[];

  // Create params for both types of posts
  const portfolioParams = portfolioPosts!.map((post: PortfolioPost) => ({
    post_type: 'portfolio',
    id: post.id.toString(),
    title: post.title.toLowerCase().replace(/\s+/g, '-'),
  }));

  const blogParams = blogPosts!.map((post: BlogPost) => ({
    post_type: 'blog',
    id: post.id.toString(),
    title: post.title.toLowerCase().replace(/\s+/g, '-'),
  }));

  // Combine and return all params
  return [...portfolioParams, ...blogParams];
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ post_type: string, id: string, title: string }>
}) {
  const { id, post_type } = await params;

  const post: PortfolioPost | BlogPost | null = await getPost(id, post_type);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
    };
  }

  return {
    title: `${post.title} - ${post.post_type}`,
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