import { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { getPosts, getPost } from '@/utils/getData';
import { ExternalLink, Github, Tag } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { remark } from 'remark';
import html from 'remark-html';

export default async function Page({
  params
}: {
  params: Promise<{ post_type: string, id: string, title: string }>
}) {
  const { id, title, post_type } = await params;

  const post: PortfolioPost | BlogPost | null = await getPost(id, post_type);

  const postBody = await remark().use(html).processSync(post!.body).toString();

  if (!post) {
    notFound()
  }

  // If the provided title doesn't match the actual post title, redirect to the correct URL
  const slugifiedTitle = post.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  if (title !== slugifiedTitle) {
    redirect(`/portfolio/${id}/${slugifiedTitle}`)
  }

  return (
    <article className="max-w-5xl mx-auto px-4 my-20 md:my-32">
      {/* Simple Header */}
      <header className="">
        <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
        <p className="text-xl">{post.description}</p>
      </header>

      {/* Tech Stack */}
      <div className="flex my-4">
        { post.post_tags.map((tag, i) => (
          <span key={i} className="bg-main text-lighttext rounded-md px-2 py-1.5 mr-2 flex items-center">
            <Tag size={15} className='mr-2' />
            {tag.tag}
          </span>
        ))}
      </div>

      {/* Main Image */}
      <div className="w-full h-[16rem] md:h-[24rem] relative mx-auto">
        <Image
          src={post.image}
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          alt="post_image"
          className="rounded-lg"
        />
      </div>

      {/* Quick Info */}
      <div className="flex flex-wrap gap-4 my-8 text-lighttext">
        <Link
          href={post.source_link}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-main"
        >
          <Github size={18} />
          View Source
        </Link>
        <Link
          href={post.demo_link}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-main"
        >
          <ExternalLink size={18} />
          Live Demo
        </Link>
      </div>

      {/* Project Description */}
      <div className="max-w-none text-xl space-y-4 prose prose-invert"
        dangerouslySetInnerHTML={{ __html: postBody }}>
      </div>
    </article>
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