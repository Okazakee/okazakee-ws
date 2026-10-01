'use client';
import { debounce } from '@/utils/debounce';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import validator from 'validator';
import { searchPosts } from '@/app/actions/search';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';
import { TokenBucket } from '@/utils/tokenBucket';

export default function Searchbar({
  post_type,
  SetPosts,
  initialPosts,
  SetIsRateLimited,
  locale,
}: {
  post_type: string;
  SetPosts: Dispatch<SetStateAction<BlogPost[] | PortfolioPost[]>>;
  SetIsRateLimited: Dispatch<SetStateAction<boolean>>;
  initialPosts: BlogPost[] | PortfolioPost[];
  locale: string;
}) {
  const [searchFilter, setSearchFilter] = useState('');
  const tokenBucketRef = useRef(new TokenBucket(5, 1)); // 5 tokens, refill 1 token per second

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        if (tokenBucketRef.current.tryConsume()) {
          SetIsRateLimited(false);
          try {
            const newPosts = await searchPosts(post_type, searchQuery, locale);
            SetPosts(newPosts.posts || []);
          } catch (error) {
            console.error('Search error:', error);
            // Handle error (e.g., show error message to user)
          }
        } else {
          SetIsRateLimited(true);
        }
      }, 300),
    [SetIsRateLimited, SetPosts, post_type, locale]
  );

  useEffect(() => {
    if (searchFilter.length > 2 && searchFilter.length < 40) {
      debouncedSearch(validator.escape(searchFilter));
    } else if (searchFilter.length === 0) {
      SetPosts(initialPosts);
    }

    // Cleanup function to cancel any pending debounced calls
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchFilter, debouncedSearch, SetPosts, initialPosts]);

  const t = useTranslations('posts-section');

  return (
    <div className="relative mx-auto mb-12 max-w-xl">
      <input
        className="w-full rounded-lg border border-border-subtle bg-surface-card py-3 pr-4 pl-10 font-mono text-xs text-text-main transition-colors placeholder:text-text-dim focus:border-accent-violet/60 focus:outline-hidden"
        onChange={(e) => setSearchFilter(e.target.value)}
        placeholder={t('searchbar')}
        type="text"
        value={searchFilter}
      />
      <Search
        className="absolute top-1/2 left-3 -translate-y-1/2 text-text-dim"
        size={18}
        strokeWidth={2}
      />
    </div>
  );
}
