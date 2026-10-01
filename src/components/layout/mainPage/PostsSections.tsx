import { ErrorDiv } from '@components/common/ErrorDiv';
import PostCard from '@components/common/PostCard';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { InnerHtml } from '@/components/common/InnerHtml';
import { formatLabels } from '@/utils/formatLabels';
import { getBlogPosts, getPortfolioPosts } from '@/utils/getData';

/**
 * Home previews of the latest projects and posts (docs/DESIGN.md §6): the blog
 * band is tinted, the portfolio one is not, and each closes with the link to
 * its list page.
 */
export default async function PostsSection({ locale }: { locale: string }) {
  const portfolioPosts = await getPortfolioPosts();
  const blogPosts = await getBlogPosts();

  const t = await getTranslations({ locale, namespace: 'posts-section' });
  const sections = ['portfolio', 'blog'] as const;

  if (!portfolioPosts || !blogPosts)
    return <ErrorDiv>Error loading posts sections data</ErrorDiv>;

  return (
    <div>
      {sections.map((section) => {
        const isBlog = section === 'blog';
        const posts = isBlog ? blogPosts : portfolioPosts;

        return (
          posts.length > 0 && (
            <section
              className={`border-border-subtle/50 py-24 ${
                isBlog ? 'border-t bg-surface-alt' : ''
              }`}
              id={section}
              key={section}
            >
              <div className="mx-auto max-w-5xl px-6">
                <div className="mb-14 text-center">
                  <InnerHtml
                    as="h2"
                    className="font-heading text-2xl font-semibold text-text-white sm:text-3xl"
                    html={formatLabels(t(isBlog ? 'title2' : 'title1'))}
                  />
                  <InnerHtml
                    as="p"
                    className="mt-2 font-mono text-xs text-accent-violet-light sm:text-sm"
                    html={formatLabels(t(isBlog ? 'subtitle2' : 'subtitle1'))}
                  />
                  <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-accent-violet" />
                </div>

                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} locale={locale} post={post} />
                  ))}
                </div>

                <div className="mt-12 flex justify-center">
                  <Link
                    className="inline-flex items-center gap-2 rounded-xl bg-accent-violet-deep/80 px-6 py-2.5 font-mono text-xs text-white shadow-md shadow-accent-violet-deep/20 transition-all hover:-translate-y-0.5 hover:bg-accent-violet-deep"
                    href={`/${locale}/${section}`}
                  >
                    {t('button')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </section>
          )
        );
      })}
    </div>
  );
}
