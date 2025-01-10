'use client'
import { Search } from 'lucide-react';
import { useEffect, useState, useMemo, Dispatch, SetStateAction, useRef } from "react";
import { debounce } from 'lodash';
import { searchPosts } from "@/app/actions/search";
import { BlogPost, PortfolioPost } from "@/types/fetchedData.types";
import validator from 'validator';
import { TokenBucket } from "@/utils/tokenBucket"

export default function Searchbar({ post_type, SetPosts, initialPosts, SetIsRateLimited } : { post_type: string; SetPosts: Dispatch<SetStateAction<BlogPost[] | PortfolioPost[]>>; SetIsRateLimited: Dispatch<SetStateAction<boolean>>;  initialPosts: BlogPost[] | PortfolioPost[] }) {
  const [searchFilter, setSearchFilter] = useState('');
  const tokenBucketRef = useRef(new TokenBucket(5, 1)); // 5 tokens, refill 1 token per second

  const debouncedSearch = useMemo(() =>
    debounce(async (searchQuery: string) => {
      if (tokenBucketRef.current.tryConsume()) {
        SetIsRateLimited(false);
        try {
          const newPosts = await searchPosts(post_type, searchQuery);
          SetPosts(newPosts.posts || []);
        } catch (error) {
          console.error('Search error:', error);
          // Handle error (e.g., show error message to user)
        }
      } else {
        SetIsRateLimited(true);
        console.log('Rate limit exceeded. Please wait before searching again.');
        // You could also show a user-friendly message here
      }
    }, 300),
    []
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
  }, [searchFilter, debouncedSearch]);

  return (
    <>
      <div className="mb-10 mx-10 sm:mx-auto max-w-xl relative items-center">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search posts by title, desc or tag..."
          className="md:text-xl w-full p-2 pl-10 rounded-xl border-2 bg-lighttext border-main focus:outline-none placeholder:text-darktext placeholder:opacity-70 text-darktext transition-opacity focus:placeholder:opacity-0 placeholder:text-sm xs:placeholder:text-base sm:placeholder:text-xl"
        />
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 stroke-main"
          size={20}
          strokeWidth={2.5}
        />
      </div>
    </>
  )
}