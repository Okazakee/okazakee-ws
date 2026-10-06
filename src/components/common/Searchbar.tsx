'use client';
import { debounce } from '@/utils/debounce';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  type Dispatch,
  type SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { searchPosts } from '@/app/actions/search';
import type { BlogPost, PortfolioPost } from '@/types/fetchedData.types';

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

  const debouncedSearch = useMemo(
    () =>
      debounce(async (searchQuery: string) => {
        try {
          const result = await searchPosts(post_type, searchQuery, locale);
          if ('error' in result) {
            SetIsRateLimited(false);
            SetPosts([]);
            return;
          }
          if ('rateLimited' in result && result.rateLimited) {
            SetIsRateLimited(true);
            SetPosts([]);
            return;
          }
          SetIsRateLimited(false);
          SetPosts(result.posts);
        } catch (error) {
          console.error('Search error:', error);
        }
      }, 300),
    [SetIsRateLimited, SetPosts, post_type, locale]
  );

  useEffect(() => {
    if (searchFilter.length > 2 && searchFilter.length < 40) {
      debouncedSearch(searchFilter);
    } else if (searchFilter.length === 0) {
      SetIsRateLimited(false);
      SetPosts(initialPosts);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchFilter, debouncedSearch, SetPosts, SetIsRateLimited, initialPosts]);

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
