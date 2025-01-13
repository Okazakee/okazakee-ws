'use client'
import { useRef, useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import { usePathname } from 'next/navigation';

const useWindowSize = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // Tailwind's md breakpoint
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return { isMobile };
};

export const Tags = ({ tags }: { tags: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalWidth, setTotalWidth] = useState(0);
  const { isMobile } = useWindowSize();
  const pathname = usePathname();

  const reworkedTags = tags ? Array.from(tags.matchAll(/"([^"]*?)"/g), match => match[1]) : [];

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

  const totalChars = reworkedTags.reduce((sum, tag) => sum + tag.length, 0);

  const regex = /^\/(it\/)?(portfolio|blog)\/\d+\/.+$/;

  const isPostPage = regex.test(pathname);

  const shouldAnimate = isPostPage
  ? isMobile // Only animate if it's a post page and we're on mobile
    : (isMobile
        ? (totalChars > 30 || reworkedTags.length > 3)
        : (totalChars > 34 || reworkedTags.length > 4));

  return (
    <div className="relative overflow-hidden w-full">
      <div
        ref={containerRef}
        className={`flex whitespace-nowrap transition-all duration-[400ms] ease-in-out ${
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
        {reworkedTags.map((tag, i) => (
          <span
            key={i}
            className="tag bg-secondary text-lighttext text-base gap-2 px-2 xs:py-1 sm:py-1 pt-0.5 rounded-lg flex items-center mr-2 xs:mb-1 sm:mb-1 sm:mt-2 xs:mt-2 mt-1"
          >
            <Tag size={15} />
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default Tags;