import { Glitch } from '@components/common/Glitch';
import { ArrowUpRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { PostCardData } from '@/types/fetchedData.types';
import { resolveBlurDataURL } from '@/utils/blurPlaceholder';
import { getPostHref } from '@/utils/postHref';
import { PostViewsBadge } from './PostViews';
import { Tags } from './Tags';

/**
 * Post card (docs/DESIGN.md §5.1): one link for the whole card, hover colours on
 * the card, and the glitch (`docs/DESIGN.md` §3) on the content *inside* it —
 * the frame keeps still. The same flicker as the archive card plays on hover
 * and click; `trigger="group"` gives its padded link the full card hit area.
 *
 * Data contract: `post` is exactly `POST_CARD_COLUMNS` and `postType` is
 * threaded explicitly — field presence is never used as a discriminator.
 */
export default function PostCard({
  post,
  postType,
  locale,
}: {
  post: PostCardData;
  postType: 'blog' | 'portfolio';
  locale: string;
}) {
  const title = String(
    postType === 'portfolio'
      ? post.title_en
      : post[`title_${locale}` as 'title_en' | 'title_it']
  );
  const description = String(
    post[`description_${locale}` as 'description_en' | 'description_it'] ??
      ''
  );
  const href = getPostHref({ locale, postType, id: post.id, title });
  const blurDataURL = resolveBlurDataURL(post.blurhashURL);

  return (
    <Link
      className="group relative flex rounded-2xl border border-border-subtle bg-surface-card p-4 transition-colors hover:border-accent-violet/50 hover:bg-surface-card-hover sm:p-5"
      href={href}
    >
      <Glitch
        className="w-full"
        hoverPreset="click"
        probability={0.25}
        mode="both"
        trigger="group"
      >
        <span className="flex w-full flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-6">
          <div className="relative h-[200px] w-full shrink-0 overflow-hidden rounded-xl bg-surface-raised sm:h-[220px] lg:w-[380px]">
            <Image
              alt={title}
              blurDataURL={blurDataURL}
              className="object-cover"
              fill
              placeholder={blurDataURL ? 'blur' : 'empty'}
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 600px, 100vw"
              src={post.image}
            />
            <PostViewsBadge postId={post.id} postType={postType} />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
            <div>
              <h3 className="mb-2 flex items-center justify-between font-heading text-xl font-bold text-text-white transition-colors group-hover:text-accent-violet-light sm:text-2xl">
                <span>{title}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 text-text-dim transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent-violet-light"
                />
              </h3>
              <p className="mb-6 text-sm leading-relaxed text-text-muted sm:text-base">
                {description}
              </p>
            </div>
            <div className="pt-2">
              <Tags tags={post.post_tags} />
            </div>
          </div>
        </span>
      </Glitch>
    </Link>
  );
}
