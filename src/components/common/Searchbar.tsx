'use client'
import { Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { debounce } from 'lodash'
import { PortfolioPost, BlogPost } from "@/types/fetchedData.types";

export default function Searchbar({ /* posts */ } : {posts: PortfolioPost[] | BlogPost[]}) {
  const [searchFilter, setSearchFilter] = useState('');

  const debouncedSearch = useMemo(() =>
    debounce(async (value: string) => {
      // api call
      console.log(value);
    }, 300),
    []
  );


  useEffect(() => {
    if (searchFilter.length >= 3) {
      debouncedSearch(searchFilter);
    }

    // Cleanup function to cancel any pending debounced calls
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchFilter, debouncedSearch]);

  return (
    <>
      <div className="mb-10 mx-auto max-w-xl relative items-center">
        <input
          type="text"
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          placeholder="Search posts by title or tag..."
          className="text-xl w-full p-3 pl-10 rounded-xl border-2 bg-lighttext border-main focus:outline-none placeholder:text-darktext placeholder:opacity-70 text-darktext"
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