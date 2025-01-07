'use client'
import { useRef, useEffect, useState } from 'react';
import { PostTag } from "@/types/fetchedData.types";
import { Tag } from 'lucide-react';

export const Tags = ({ tags }: { tags: PostTag[] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalWidth, setTotalWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      const tagElements = containerRef.current.querySelectorAll('.tag');
      let width = 0;
      tagElements.forEach((el) => {
        width += el.getBoundingClientRect().width + 8;
      });
      setTotalWidth(width);
    }
  }, [tags]);

  const totalChars = tags.reduce((sum, tag) => sum + tag.tag.length, 0);
  const shouldAnimate = totalChars > 40 && tags.length > 2;

  return (
    <div className="relative overflow-hidden w-full">
      <div
        ref={containerRef}
        className={`flex whitespace-nowrap ${
          shouldAnimate ? 'animate-carousel' : 'flex-wrap'
        }`}
        style={
          shouldAnimate
            ? ({
                '--total-width': `${totalWidth}px`,
                '--container-width': '100%',
              } as React.CSSProperties)
            : {}
        }
      >
        {tags.map((tag, i) => (
          <span
            key={i}
            className="tag bg-secondary text-lighttext text-md gap-2 md:px-2 px-2 py-1 rounded-lg flex items-center mr-2 mb-1 mt-2"
          >
            <Tag size={15} />
            {tag.tag}
          </span>
        ))}
      </div>
    </div>
  );
};