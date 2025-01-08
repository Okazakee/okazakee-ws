'use client'
import { Search } from "lucide-react";
import { useEffect, useState, useMemo, Dispatch, SetStateAction } from "react";
import { debounce } from 'lodash';
import { searchPosts } from "@/app/actions/search";
import { BlogPost, PortfolioPost } from "@/types/fetchedData.types";

export default function Searchbar({ post_type, SetPosts } : { post_type: string; SetPosts: Dispatch<SetStateAction<BlogPost[] | PortfolioPost[]>> }) {
  const [searchFilter, setSearchFilter] = useState('');

  const debouncedSearch = useMemo(() =>
    debounce(async (searchQuery: string) => {
      // api call
      const newPosts = await searchPosts(post_type, searchQuery, '12');

      SetPosts(newPosts.posts || []);
    }, 300),
    []
  );


  useEffect(() => {
    if (searchFilter.length > 2) {
      debouncedSearch(searchFilter);
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
          placeholder="Search posts by title or tag..."
          className="md:text-xl w-full p-2 pl-10 rounded-xl border-2 bg-lighttext border-main focus:outline-none placeholder:text-darktext placeholder:opacity-70 text-darktext"
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