import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ErrorDiv } from '@/components/common/ErrorDiv';
import { InnerHtml } from '@/components/common/InnerHtml';
import PostList from '@/components/common/PostList';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { formatLabels } from '@/utils/formatLabels';
import { getPosts } from '@/utils/getData';
import { SITE_NAME, SITE_OG_IMAGE } from '@/utils/structuredData';

// Unknown single-segment paths land here and call notFound(), which the
// dev-mode instant validation reports as an unrenderable target. The page is
// cached and still navigates instantly; this only opts the segment out of the
// validation feedback (see the instant-navigation guide).
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ post_type: string; locale: string }>;
}) {
  const { post_type, locale } = await params;
  const normalizedLocale = locale === 'it' ? 'it' : 'en';
  const baseUrl = process.env.DOMAIN_URL;

  if (!validPostTypes.includes(post_type)) {
    return {
      title: normalizedLocale === 'en' ? 'Post Not Found' : 'Post non trovato',
      description:
        normalizedLocale === 'en'
          ? 'The requested post could not be found.'
          : 'Il post richiesto non è stato trovato',
    };
  }

  const title = post_type.charAt(0).toUpperCase() + post_type.slice(1);

  const tagDesc =
    normalizedLocale === 'en'
      ? post_type === 'portfolio'
        ? 'Selected software projects, open-source work and technical experiments.'
        : 'Articles, notes and personal writing about software, technology and other topics.'
      : post_type === 'portfolio'
        ? 'Una selezione di progetti software, lavori open-source ed esperimenti tecnici.'
        : 'Articoli, note e scritti personali su software, tecnologia e altri argomenti.';

  const pageTitle = `${title} - Okazakee WS`;

  return {
    title: pageTitle,
    description: tagDesc,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: pageTitle,
      description: tagDesc,
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: tagDesc,
      images: [SITE_OG_IMAGE],
    },
    alternates: {
      canonical: `${baseUrl}/${normalizedLocale}/${post_type}`,
      languages: {
        en: `${baseUrl}/en/${post_type}`,
        it: `${baseUrl}/it/${post_type}`,
        'x-default': `${baseUrl}/en/${post_type}`,
      },
    },
  };
}

const validPostTypes = ['portfolio', 'blog'];

export async function generateStaticParams() {
  return [
    { locale: 'en', post_type: 'portfolio' },
    { locale: 'it', post_type: 'portfolio' },
    { locale: 'en', post_type: 'blog' },
    { locale: 'it', post_type: 'blog' },
  ];
}

export default async function PostsPage({
  params,
}: {
  params: Promise<{ post_type: string; locale: string }>;
}) {
  const { post_type, locale } = await params;

  if (!validPostTypes.includes(post_type)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'posts-section' });

  // Get posts based on the post_type
  const posts = (await getPosts(post_type)) as PortfolioPost[] | BlogPost[];

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="mb-14 text-center">
        <InnerHtml
          as="h1"
          className="font-heading text-2xl font-semibold text-text-white sm:text-3xl"
          html={formatLabels(post_type === 'blog' ? t('title2') : t('title1'))}
        />
        <InnerHtml
          as="p"
          className="mt-2 font-mono text-xs text-accent-violet-light sm:text-sm"
          html={formatLabels(
            post_type === 'blog' ? t('subtitle2') : t('subtitle1')
          )}
        />
        <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-accent-violet" />
      </div>

      {posts.length > 0 ? (
        <PostList initialPosts={posts} post_type={post_type} locale={locale} />
      ) : (
        <ErrorDiv>{t('no-posts')}</ErrorDiv>
      )}
    </section>
  );
}
