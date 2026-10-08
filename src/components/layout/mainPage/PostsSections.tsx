import { ErrorDiv } from '@components/common/ErrorDiv';
import PostCard from '@components/common/PostCard';
import { SectionNumber } from '@components/common/SectionNumber';
import { Archive, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { InnerHtml } from '@/components/common/InnerHtml';
import { formatLabels } from '@/utils/formatLabels';
import { getBlogPosts, getPortfolioPosts, getPostCount } from '@/utils/getData';

/**
 * Home previews of the latest projects and posts: each section shows up to
 * three cards and a localized archive card linking to the full list.
 */
export default async function PostsSection({ locale }: { locale: string }) {
  const [portfolioPosts, blogPosts, portfolioCount, blogCount] =
    await Promise.all([
      getPortfolioPosts(),
      getBlogPosts(),
      getPostCount('portfolio'),
      getPostCount('blog'),
    ]);

  const t = await getTranslations({ locale, namespace: 'posts-section' });
  const sections = ['portfolio', 'blog'] as const;

  if (!portfolioPosts || !blogPosts)
    return <ErrorDiv>Error loading posts sections data</ErrorDiv>;

  return (
    <div>
      {sections.map((section) => {
        const isBlog = section === 'blog';
        const sectionIndex = isBlog ? 5 : 4;
        const posts = isBlog ? blogPosts : portfolioPosts;
        const totalCount = isBlog ? blogCount : portfolioCount;
        const remainingCount = Math.max(0, totalCount - posts.length);

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
                  <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-baseline">
                    <SectionNumber
                      className="justify-self-end pr-2.5"
                      index={sectionIndex}
                    />
                    <InnerHtml
                      as="h2"
                      className="font-heading text-2xl font-semibold text-text-white sm:text-3xl"
                      html={formatLabels(t(isBlog ? 'title2' : 'title1'))}
                    />
                    <span aria-hidden="true" />
                  </div>
                  <InnerHtml
                    as="p"
                    className="mx-auto mt-2 w-fit max-w-xl font-mono text-xs text-accent-violet-light sm:text-sm"
                    html={formatLabels(t(isBlog ? 'subtitle2' : 'subtitle1'))}
                  />
                  <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-accent-violet" />
                </div>

                <div className="space-y-6">
                  {posts.slice(0, 3).map((post) => (
                    <PostCard key={post.id} locale={locale} post={post} />
                  ))}
                </div>

                <Link
                  className="mt-6 flex w-full flex-col gap-5 rounded-2xl border border-dashed border-border-subtle bg-surface-card/40 p-6 transition-all hover:border-accent-violet/50 hover:bg-surface-card-hover/60 sm:min-h-[290px] sm:flex-row sm:items-center sm:justify-between sm:p-7 md:min-h-[275px] lg:min-h-[175px] lg:py-6"
                  href={`/${locale}/${section}`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-surface-raised text-accent-violet">
                        <Archive className="h-5 w-5" />
                      </span>
                      <h3 className="font-mono text-base font-medium text-text-white sm:text-lg">
                        {remainingCount > 0
                          ? t(
                              isBlog
                                ? 'archiveMorePosts'
                                : 'archiveMoreProjects',
                              { count: remainingCount }
                            )
                          : t(
                              isBlog ? 'archiveAllPosts' : 'archiveAllProjects'
                            )}
                      </h3>
                    </div>
                    <p className="mt-2 max-w-xl font-mono text-xs text-text-muted sm:text-sm">
                      {t(
                        isBlog
                          ? 'archiveDescriptionPosts'
                          : 'archiveDescriptionProjects'
                      )}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-accent-violet px-5 py-2.5 font-mono text-sm font-semibold text-text-on-accent transition-colors hover:bg-accent-violet-deep dark:bg-accent-violet-deep dark:text-white dark:hover:bg-accent-violet-deep sm:w-auto">
                    {t(
                      isBlog ? 'archiveViewAllPosts' : 'archiveViewAllProjects'
                    )}
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            </section>
          )
        );
      })}
    </div>
  );
}
