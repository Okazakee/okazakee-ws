import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { ErrorDiv } from '@/components/common/ErrorDiv';
import { InnerHtml } from '@/components/common/InnerHtml';
import PostList from '@/components/common/PostList';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { formatLabels } from '@/utils/formatLabels';
import { getPosts } from '@/utils/getData';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ post_type: string; locale: string }>;
}) {
  const { post_type, locale } = await params;
  const normalizedLocale = locale === 'it' ? 'it' : 'en';

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
      ? `My ${post_type} showcasing ${
          post_type === 'portfolio'
            ? 'projects i worked on'
            : 'my thoughts and experiences'
        }`
      : `Il mio ${post_type} mostra ${
          post_type === 'portfolio'
            ? 'progetti a cui ho lavorato'
            : 'le mie riflessioni ed esperienze'
        }`;

  return {
    title: `${title} - Okazakee WS`,
    description: tagDesc,
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
          html={formatLabels(
            post_type === 'blog' ? t('title2') : t('title1')
          )}
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
