import { ArrowUpRight, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { getPostHref } from '@/utils/postHref';
import { Tags } from './Tags';

export default function PostCard({
  post,
  locale,
}: {
  post: PortfolioPost | BlogPost;
  locale: string;
}) {
  const isPortfolioPost = 'source_link' in post;
  const postType = isPortfolioPost ? 'portfolio' : 'blog';
  const title = String(
    postType === 'portfolio'
      ? post.title_en
      : post[`title_${locale}` as keyof typeof post]
  );
  const description = String(
    post[`description_${locale}` as keyof typeof post] ?? ''
  );
  const href = getPostHref({ locale, postType, id: post.id, title });

  return (
    <Link
      className="group relative flex flex-col gap-5 rounded-2xl border border-border-subtle bg-surface-card p-4 transition-colors hover:border-accent-violet/50 hover:bg-surface-card-hover sm:p-5 lg:flex-row lg:items-stretch lg:gap-6"
      href={href}
    >
      <div className="relative h-[200px] w-full shrink-0 overflow-hidden rounded-xl bg-surface-raised sm:h-[220px] lg:w-[380px]">
        <Image
          alt={title}
          blurDataURL={post.blurhashURL || undefined}
          className="object-cover"
          fill
          placeholder={post.blurhashURL ? 'blur' : 'empty'}
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 600px, 100vw"
          src={post.image}
        />
        <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-base/85 px-2 py-0.5 font-mono text-[11px] text-text-muted backdrop-blur-surface">
          <Eye className="h-3.5 w-3.5 text-text-dim" />
          {post.views}
        </span>
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
    </Link>
  );
}
