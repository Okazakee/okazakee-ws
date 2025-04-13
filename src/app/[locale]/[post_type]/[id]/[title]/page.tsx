import ShareButton from '@/components/common/ShareButton';
import Tags from '@/components/common/Tags';
import MarkdownRenderer from '@/components/layout/MarkdownRenderer';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { getPosts, getPost } from '@utils/getData';
import { CirclePlay, Clock, ExternalLink, Github, Star } from 'lucide-react';
import moment from 'moment';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

/* ONLY PORTFOLIO POSTS USE title_en AS TITLE FOR BOTH LANGS, BLOG POSTS CAN SWAP title_en and title_it */

export default async function Page({
  params,
}: {
  params: Promise<{
    post_type: string;
    id: string;
    title: string;
    locale: string;
  }>;
}) {
  const { id, title, post_type, locale } = await params;

  const post: PortfolioPost | BlogPost | null = await getPost(id, post_type);

  const t = await getTranslations('posts-section');

  let ghStars = 0;

  if (post_type === 'portfolio' && post) {
    const portfolioPost = post as PortfolioPost; // Type assertion
    const repoName = portfolioPost.source_link.split('/').pop();

    ghStars = await fetch(`https://api.github.com/repos/okazakee/${repoName}`)
      .then((res) => res.json())
      .then((data) => data.stargazers_count);
  }

  // checks
  if (!post) {
    notFound();
  }

  type LocaleKey = 'title_en' | 'title_it';

  const initTitle =
    post_type === 'portfolio'
      ? post.title_en
      : post[`title_${locale}` as LocaleKey];

  // If the provided title doesn't match the actual post title, redirect to the correct URL
  const slugifiedTitle = initTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  if (title !== slugifiedTitle) {
    redirect(`/${post_type}/${id}/${slugifiedTitle}`);
  }

  const localeKey = `body_${locale}` as keyof typeof post;

  const postDescription = `description_${locale}` as keyof typeof post;

  const formattedDate = moment(post?.created_at).format('DD/MM/YYYY');

  const postURL = `${process.env.DOMAIN_URL}/${locale}/${post_type}/${id}/${slugifiedTitle}`;

  return (
    <article className="max-w-5xl mx-auto px-4 mb-20 md:mb-32 md:mt-16 mt-10">
      <header className="flex relative mb-6 md:mb-0">
        <div>
          <h1 className="md:text-4xl text-2xl xs:text-3xl sm:text-3xl font-bold mb-4">
            {initTitle}
          </h1>
          <p className="xs:text-xl sm:text-xl">{post[postDescription]}</p>
        </div>
      </header>

      {/* TAGS */}
      <div className="md:my-4">
        <Tags tags={post.post_tags} />
      </div>

      {/* Main Image */}
      <div className="w-full h-[14rem] md:h-[24rem] relative mx-auto mt-6 md:mt-0">
        <Image
          placeholder="blur"
          blurDataURL={post.blurhashURL}
          src={post.image}
          fill
          priority
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          sizes="100vw"
          style={{
            objectFit: 'cover',
            objectPosition: 'center',
          }}
          alt="post_image"
          className="rounded-lg border-[3px] border-main"
        />
      </div>

      {/* Quick Info */}
      <div className="flex gap-5 md:justify-normal md:gap-6 sm:gap-4 my-6 md:my-8 text-lighttext items-center">
        <div
          className={`hidden gap-6 ${post_type === 'portfolio' && 'md:flex'}`}
        >
          {post_type === 'portfolio' &&
            post &&
            'source_link' in post &&
            post.source_link &&
            post.source_link !== null && (
              <Link
                target="_blank"
                href={post.source_link}
                className="flex items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary"
                data-umami-event="View Source Code button"
                data-umami-event-post={title}
              >
                <Github size={18} />
                <div className="mt-0.5 md:mt-0">{t('source')}</div>
              </Link>
            )}

          {post_type === 'portfolio' &&
            post &&
            'demo_link' in post &&
            post.demo_link &&
            post.demo_link !== null && (
              <Link
                target="_blank"
                href={post.demo_link}
                className="flex items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary"
                data-umami-event="View Demo button"
                data-umami-event-post={title}
              >
                <ExternalLink size={18} />
                <div className="mt-0.5 md:mt-0">{t('demo')}</div>
              </Link>
            )}
          {post_type === 'portfolio' &&
            post &&
            'store_link' in post &&
            post.store_link &&
            post.store_link !== null && (
              <Link
                target="_blank"
                href={post.store_link}
                className="flex items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary"
                data-umami-event="Play Store button"
                data-umami-event-post={title}
              >
                <CirclePlay size={18} />
                <div className="mt-0.5 md:mt-0">{t('store')}</div>
              </Link>
            )}
        </div>

        <div className="flex items-center text-darktext dark:text-lighttext">
          <Clock size={20} className="mr-2" />
          <span className="mt-0.5">{formattedDate}</span>
        </div>

        {post_type === 'portfolio' && (
          <div className="flex items-center text-darktext dark:text-lighttext">
            <Star size={20} className="mr-2" />
            <span className="mt-0.5">{ghStars || 0}</span>
          </div>
        )}

        <ShareButton
          className="ml-auto"
          buttonTitle={locale === 'en' ? 'Copy post url' : 'Copia url del post'}
          url={postURL}
          title={post.title_en}
        />
      </div>

      {/* mobile btns */}
      <div
        className={`text-lighttext ${post_type === 'portfolio' ? 'flex mb-8 md:hidden' : 'hidden'}  ${post_type === 'portfolio' && post && 'source_link' in post && 'demo_link' in post ? 'justify-center' : 'justify-start'}`}
      >
        {post_type === 'portfolio' &&
          post &&
          'source_link' in post &&
          post.source_link &&
          post.source_link !== null && (
            <Link
              target="_blank"
              href={post.source_link || ''}
              className={`flex ${post.source_link && post.demo_link || post.source_link && post.store_link ? 'w-full mr-5' : 'w-full'} text-sm xs:text-base justify-center items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary`}
              data-umami-event="View Source Code button"
              data-umami-event-post={title}
            >
              <Github size={18} />
              <div className="mt-0.5 md:mt-0">{t('source')}</div>
            </Link>
          )}

        {post_type === 'portfolio' &&
          post &&
          'demo_link' in post &&
          post.demo_link &&
          post.demo_link !== null && (
            <Link
              target="_blank"
              href={post.demo_link}
              className={`flex ${post.source_link && post.demo_link ? 'w-full' : 'w-full'} text-sm xs:text-base justify-center items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary`}
              data-umami-event="View Demo button"
              data-umami-event-post={title}
            >
              <ExternalLink size={18} />
              <div className="mt-0.5 md:mt-0">{t('demo')}</div>
            </Link>
          )}
        {post_type === 'portfolio' &&
          post &&
          'store_link' in post &&
          post.store_link &&
          post.store_link !== null && (
            <Link
              target="_blank"
              href={post.store_link}
              className={`flex ${post.store_link && post.store_link ? 'w-full' : 'w-full'} text-sm xs:text-base justify-center items-center gap-2 md:px-4 px-2 py-2 rounded-lg bg-secondary`}
              data-umami-event="Play Store button"
              data-umami-event-post={title}
            >
              <CirclePlay size={18} />
              <div className="mt-0.5 md:mt-0">{t('store')}</div>
            </Link>
          )}
      </div>

      {/* Project Description */}
      <div
        id="post"
        className="space-y-4 max-w-none xs:text-lg sm:text-xl prose dark:prose-invert text-left"
      >
        <MarkdownRenderer markdown={String(post[localeKey])} />
      </div>
    </article>
  );
}

export const revalidate = 86400;

export const dynamicParams = true;

export async function generateStaticParams() {
  const locales = ['en', 'it'];
  const portfolioPosts = (await getPosts(
    'portfolio',
    undefined,
    undefined,
    100
  )) as PortfolioPost[];
  const blogPosts = (await getPosts(
    'blog',
    undefined,
    undefined,
    100
  )) as BlogPost[];

  const portfolioParams = portfolioPosts.flatMap((post: PortfolioPost) =>
    locales.map((locale) => ({
      locale,
      post_type: 'portfolio',
      id: post.id.toString(),
      title: post.title_en.toLowerCase().replace(/\s+/g, '-'),
    }))
  );

  const blogParams = blogPosts.flatMap((post: BlogPost) =>
    locales.map((locale) => ({
      locale,
      post_type: 'blog',
      id: post.id.toString(),
      title:
        locale === 'en'
          ? post.title_en.toLowerCase().replace(/\s+/g, '-')
          : post.title_it.toLowerCase().replace(/\s+/g, '-'),
    }))
  );

  return [...portfolioParams, ...blogParams];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    post_type: string;
    id: string;
    title: string;
    locale: string;
  }>;
}) {
  const { id, post_type, locale } = await params;

  const post: PortfolioPost | BlogPost | null = await getPost(id, post_type);

  if (!post) {
    return {
      title: locale === 'en' ? 'Post Not Found' : 'Post non trovato',
      description:
        locale === 'en'
          ? 'The requested post could not be found.'
          : 'Il post richiesto non è stato trovato',
    };
  }

  const postDescription = `description_${locale}` as keyof typeof post;
  const postTitle =
    post_type === 'blog'
      ? (`title_${locale}` as keyof typeof post)
      : 'title_en';

  return {
    title: `${post[postTitle]} - Okazakee WS`,
    description: post[postDescription],
    openGraph: {
      title: `${post[postTitle]} - Okazakee WS`,
      description: post[postDescription],
      images: [
        {
          url: post.image,
          width: 1200,
          height: 630,
          alt: post[postTitle],
        },
      ],
    },
  };
}
