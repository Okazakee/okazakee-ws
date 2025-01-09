import { PostTags } from '@/components/common/PostTags';
import ShareButton from '@/components/common/ShareButton';
import { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { getPosts, getPost } from '@utils/getData';
import { ChevronLeft, Clock, ExternalLink, Github, Star } from 'lucide-react';
import moment from 'moment';
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

  let ghStars = 0;

  if (post_type === 'portfolio') {
    const repoName = post?.source_link.split('/').pop();

    ghStars = await fetch(`https://api.github.com/repos/okazakee/${repoName}`)
      .then((res) => res.json())
      .then((data) => data.stargazers_count);
  }

  // checks
  if (!post) {
    notFound()
  }

  // If the provided title doesn't match the actual post title, redirect to the correct URL
  const slugifiedTitle = post.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  if (title !== slugifiedTitle) {
    redirect(`/portfolio/${id}/${slugifiedTitle}`)
  }

  const postBody = await remark().use(html).processSync(post!.body).toString();

  const formattedDate = moment(post?.created_at).format('DD/MM/YYYY');

  const postURL = `https://okazakee.dev/${post_type}/${id}/${slugifiedTitle}`;

  return (
    <article className="max-w-5xl mx-auto px-4 mb-20 md:mb-32 md:mt-16 mt-10">

      <header className="flex">
          <ChevronLeft size={35} />
        <div>
          <h1 className="md:text-4xl text-3xl font-bold mb-4">{post.title}</h1>
          <p className="text-xl">{post.description}</p>
        </div>
      </header>

      {/* Tech Stack */}
      <PostTags tags={post.post_tags} />

      {/* Main Image */}
      <div className="w-full h-[16rem] md:h-[24rem] relative mx-auto">
        <Image
          placeholder='blur'
          blurDataURL={post.blurhashURL}
          src={post.image}
          fill
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          alt="post_image"
          className="rounded-lg border-[3px] border-main"
        />
      </div>

      {/* Quick Info */}
      <div className="flex gap-5 md:justify-normal md:gap-6 sm:gap-4 my-4 md:my-8 text-lighttext items-center">

      <div className={`hidden gap-6 ${post_type === 'portfolio' && 'md:flex'}`}>
          {post.source_link &&
            <Link
              target="_blank"
              href={post.source_link}
              className="flex items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary"
            >
              <Github size={18} />
              <div className='mt-0.5 md:mt-0'>
                <span className="hidden md:inline">View </span>
                Source
              </div>
            </Link>
          }

          {post.demo_link &&
            <Link
              target="_blank"
              href={post.demo_link}
              className="flex items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary"
            >
              <ExternalLink size={18} />
              <div className='mt-0.5 md:mt-0'>
                <span className="hidden md:inline">Live </span>
                Demo
              </div>
            </Link>
          }
        </div>

        <div className='flex items-center text-darktext dark:text-lighttext'>
          <Clock size={20} className='mr-2' />
          <span className='mt-0.5'>{formattedDate}</span>
        </div>

        {post_type === 'portfolio' &&
          <div className='flex items-center text-darktext dark:text-lighttext'>
            <Star size={20} className='mr-2' />
            <span className='mt-0.5'>{ghStars || 0}</span>
          </div>
        }

        <ShareButton className='ml-auto' buttonTitle='Copy post link' url={postURL} />

      </div>

      <div className={`${post_type === 'portfolio' ? 'flex mb-4 md:hidden' : 'hidden'}  ${ post.source_link && post.demo_link ? 'justify-center' : 'justify-start'}`}>
        {post.source_link &&
          <Link
            target="_blank"
            href={post.source_link}
            className={`flex ${post.source_link && post.demo_link ? 'w-full mr-5' : 'w-full'} justify-center items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary`}
          >
            <Github size={18} />
            <div className='mt-0.5 md:mt-0'>
              <span className=" md:inline">View </span>
              Source
            </div>
          </Link>
        }

        {post.demo_link &&
          <Link
            target="_blank"
            href={post.demo_link}
            className={`flex ${post.source_link && post.demo_link ? 'w-full' : 'w-full'} justify-center items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary`}
          >
            <ExternalLink size={18} />
            <div className='mt-0.5 md:mt-0'>
              <span className=" md:inline">Live </span>
              Demo
            </div>
          </Link>
        }
      </div>

      {/* Project Description */}
      <div id='post' className="max-w-none text-xl space-y-4 prose dark:prose-invert text-left"
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