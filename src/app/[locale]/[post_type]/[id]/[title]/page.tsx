import { getPost, getPosts, type PostWithAuthor } from '@utils/getData';
import {
  CirclePlay,
  Clock,
  ExternalLink,
  Globe,
  Smartphone,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { AppleIcon, GithubIcon } from '@/components/common/BrandIcons';
import GitHubStars from '@/components/common/GitHubStars';
import { JsonLd } from '@/components/common/JsonLd';
import FormattedDate from '@/components/common/FormattedDate';
import ShareButton from '@/components/common/ShareButton';
import Tags from '@/components/common/Tags';
import ViewDisplay from '@/components/common/ViewDisplay';
import MarkdownRenderer from '@/components/layout/MarkdownRenderer';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { getPostHref, slugifyTitle } from '@/utils/postHref';
import {
  buildBlogPostingNode,
  buildProjectNode,
  SITE_NAME,
} from '@/utils/structuredData';

// Unknown ids/slugs reach this segment and call notFound(), which the dev-mode
// instant validation reports as an unrenderable target. The page is cached and
// still navigates instantly; this only opts the segment out of the validation
// feedback (see the instant-navigation guide).
export const instant = false;

/* ONLY PORTFOLIO POSTS USE title_en AS TITLE FOR BOTH LANGS, BLOG POSTS CAN SWAP title_en and title_it */
const validPostTypes = new Set(['portfolio', 'blog']);
const numericIdPattern = /^\d+$/;

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

  if (!validPostTypes.has(post_type) || !numericIdPattern.test(id)) {
    notFound();
  }

  const post: PostWithAuthor | null = await getPost(id, post_type);

  const t = await getTranslations({ locale, namespace: 'posts-section' });

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
  const slugifiedTitle = slugifyTitle(initTitle);

  if (title !== slugifiedTitle) {
    redirect(`/${locale}/${post_type}/${id}/${slugifiedTitle}`);
  }

  const localeKey = `body_${locale}` as keyof typeof post;

  const postDescription = `description_${locale}` as keyof typeof post;

  const postURL = `${process.env.DOMAIN_URL}/${locale}/${post_type}/${id}/${slugifiedTitle}`;

  const linkClass =
    'inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-3 py-2 text-text-muted transition-colors hover:border-accent-violet/50 hover:text-text-white';
  const mobileLinkClass =
    'flex flex-1 items-center justify-center gap-2 rounded-lg border border-accent-violet/40 bg-accent-violet/10 px-3 py-3 font-mono text-xs text-accent-violet-light transition-colors hover:border-accent-violet hover:bg-accent-violet/20';

  const metaLinks: {
    key: string;
    href: string;
    label: string | null;
    icon: React.ReactNode;
    event: string;
  }[] = [];

  if (post_type === 'portfolio' && 'website' in post && post.website) {
    metaLinks.push({
      key: 'website',
      href: post.website,
      label: null,
      icon: <Globe size={14} />,
      event: 'Website button',
    });
  }

  if (post_type === 'portfolio' && 'source_link' in post && post.source_link) {
    metaLinks.push({
      key: 'source',
      href: post.source_link,
      label: t('source'),
      icon: <GithubIcon size={14} />,
      event: 'View Source Code button',
    });
  }

  if (post_type === 'portfolio' && 'demo_link' in post && post.demo_link) {
    metaLinks.push({
      key: 'demo',
      href: post.demo_link,
      label: t('demo'),
      icon: <ExternalLink size={14} />,
      event: 'View Demo button',
    });
  }

  if (post_type === 'portfolio' && 'store_link' in post && post.store_link) {
    metaLinks.push({
      key: 'store',
      href: post.store_link,
      label: t('store'),
      icon: <CirclePlay size={14} />,
      event: 'Play Store button',
    });
  }

  if (post_type === 'portfolio' && 'fdroid_link' in post && post.fdroid_link) {
    metaLinks.push({
      key: 'fdroid',
      href: post.fdroid_link,
      label: t('fdroid'),
      icon: <Smartphone size={14} />,
      event: 'F-Droid button',
    });
  }

  if (
    post_type === 'portfolio' &&
    'ios_store_link' in post &&
    post.ios_store_link
  ) {
    metaLinks.push({
      key: 'ios',
      href: post.ios_store_link,
      label: t('ios'),
      icon: <AppleIcon size={14} />,
      event: 'iOS Store button',
    });
  }

  const authorBlock = post.author ? (
    <>
      <span className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-raised">
        {post.author.avatar_url ? (
          <Image
            alt={post.author.display_name}
            className="object-cover"
            fill
            sizes="32px"
            src={post.author.avatar_url}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-mono text-xs text-text-muted">
            {post.author.display_name.charAt(0).toUpperCase()}
          </span>
        )}
      </span>
      <span className="text-sm text-text-main">
        {post.author.display_name}
      </span>
    </>
  ) : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    ...(post_type === 'blog'
      ? buildBlogPostingNode({
          baseUrl: process.env.DOMAIN_URL ?? '',
          canonicalUrl: postURL,
          locale,
          title: initTitle,
          description: String(post[postDescription]),
          image: post.image,
          datePublished: post.created_at,
        })
      : buildProjectNode({
          baseUrl: process.env.DOMAIN_URL ?? '',
          canonicalUrl: postURL,
          id: post.id,
          name: post.title_en,
          description: String(post[postDescription]),
          links: {
            website: 'website' in post ? post.website : null,
            demo: 'demo_link' in post ? post.demo_link : null,
            store: 'store_link' in post ? post.store_link : null,
            source: 'source_link' in post ? post.source_link : null,
          },
        })),
  };

  return (
    <article className="mx-auto max-w-5xl px-6 pt-12 pb-24 md:pt-24">
      <JsonLd data={jsonLd} />
      <div className="mx-auto max-w-3xl">
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-text-white md:text-4xl">
          {initTitle}
        </h1>
        <p className="mt-5 text-base leading-relaxed text-text-muted">
          {String(post[postDescription])}
        </p>
        <div className="mt-7">
          <Tags tags={post.post_tags} />
        </div>
      </div>

      <div className="relative mt-10 h-56 w-full overflow-hidden rounded-2xl border border-accent-violet bg-surface-raised md:h-96">
        <Image
          alt="post_image"
          blurDataURL={post.blurhashURL}
          className="object-cover"
          decoding="sync"
          fetchPriority="high"
          fill
          loading="eager"
          placeholder="blur"
          priority
          sizes="(min-width: 1024px) 1024px, 100vw"
          src={post.image}
        />
      </div>

      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center gap-4 font-mono text-xs">
        {metaLinks.length > 0 && (
          <div className="hidden items-center gap-3 md:flex">
            {metaLinks.map((link) => (
              <Link
                className={linkClass}
                data-umami-event={link.event}
                data-umami-event-post={title}
                href={link.href}
                key={link.key}
                rel="noopener noreferrer"
                target="_blank"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {post_type !== 'portfolio' && authorBlock && (
          <div className="hidden items-center gap-3 md:flex">
            {authorBlock}
          </div>
        )}

        <span className="inline-flex items-center gap-2">
          <Clock size={14} />
          <FormattedDate date={post?.created_at} />
        </span>

        {post_type === 'portfolio' &&
          post &&
          'source_link' in post &&
          post.source_link && <GitHubStars sourceLink={post.source_link} />}

        <ViewDisplay
          initialViews={post.views ?? 0}
          postId={id}
          postType={post_type as 'blog' | 'portfolio'}
        />

        <ShareButton
          buttonTitle={locale === 'en' ? 'Copy post url' : 'Copia url del post'}
          className="ml-auto"
          title={post.title_en}
          url={postURL}
        />
      </div>

      {post_type !== 'portfolio' && authorBlock && (
        <div className="mx-auto mt-5 flex max-w-3xl items-center gap-3 md:hidden">
          {authorBlock}
        </div>
      )}

      {metaLinks.length > 0 && (
        <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-2 md:hidden">
          {metaLinks.map((link, index) =>
            index % 2 === 0 ? (
              <div className="flex gap-2" key={link.key}>
                {[metaLinks[index], metaLinks[index + 1]]
                  .filter(Boolean)
                  .map((item) => (
                    <Link
                      className={mobileLinkClass}
                      data-umami-event={item.event}
                      data-umami-event-post={title}
                      href={item.href}
                      key={item.key}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  ))}
              </div>
            ) : null
          )}
        </div>
      )}

      <div className="post mx-auto mt-12 max-w-3xl text-left">
        <MarkdownRenderer markdown={String(post[localeKey])} />
      </div>
    </article>
  );
}

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
      title: slugifyTitle(post.title_en),
    }))
  );

  const blogParams = blogPosts.flatMap((post: BlogPost) =>
    locales.map((locale) => ({
      locale,
      post_type: 'blog',
      id: post.id.toString(),
      title: slugifyTitle(locale === 'en' ? post.title_en : post.title_it),
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
  const normalizedLocale = locale === 'it' ? 'it' : 'en';

  if (!validPostTypes.has(post_type) || !numericIdPattern.test(id)) {
    return {
      title: normalizedLocale === 'en' ? 'Post Not Found' : 'Post non trovato',
      description:
        normalizedLocale === 'en'
          ? 'The requested post could not be found.'
          : 'Il post richiesto non è stato trovato',
    };
  }

  const post: PortfolioPost | BlogPost | null = await getPost(id, post_type);

  if (!post) {
    return {
      title: normalizedLocale === 'en' ? 'Post Not Found' : 'Post non trovato',
      description:
        normalizedLocale === 'en'
          ? 'The requested post could not be found.'
          : 'Il post richiesto non è stato trovato',
    };
  }

  const postDescription = `description_${normalizedLocale}` as keyof typeof post;
  const postTitle =
    post_type === 'blog'
      ? (`title_${normalizedLocale}` as keyof typeof post)
      : 'title_en';

  const baseUrl = process.env.DOMAIN_URL;
  const itTitle = post_type === 'portfolio' ? post.title_en : post.title_it;
  const enUrl = `${baseUrl}${getPostHref({
    locale: 'en',
    postType: post_type,
    id,
    title: post.title_en,
  })}`;
  const itUrl = `${baseUrl}${getPostHref({
    locale: 'it',
    postType: post_type,
    id,
    title: itTitle,
  })}`;

  return {
    title: `${post[postTitle]} - Okazakee WS`,
    description: post[postDescription],
    alternates: {
      canonical: normalizedLocale === 'en' ? enUrl : itUrl,
      languages: {
        en: enUrl,
        it: itUrl,
        'x-default': enUrl,
      },
    },
    openGraph: {
      type: post_type === 'blog' ? 'article' : 'website',
      siteName: SITE_NAME,
      title: `${post[postTitle]} - Okazakee WS`,
      description: post[postDescription],
      ...(post_type === 'blog'
        ? {
            publishedTime: post.created_at,
            authors: [`${baseUrl}/#person`],
          }
        : {}),
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
