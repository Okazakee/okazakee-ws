'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpToLine } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ScrollTop() {
  const [showLink, setShowLink] = useState(false);
  const [buttonOffset, setButtonOffset] = useState(16); // Initial offset from bottom in px
  const [opacity, setOpacity] = useState(0); // Start with opacity 0
  const t = useTranslations('footer');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const totalHeight = document.body.scrollHeight;

      setShowLink(scrollY > 50); // Start showing link earlier (at 50px down)

      // Adjust opacity based on scroll position (fade in as user scrolls down)
      const fadeInThreshold = 200;
      const opacityValue = Math.min(1, (scrollY - 50) / (fadeInThreshold - 50)); // Gradual fade-in effect
      setOpacity(opacityValue);

      // Adjust button offset when near the bottom
      if (scrollY + viewportHeight >= totalHeight - 200) {
        setButtonOffset(100 - (totalHeight - (scrollY + viewportHeight)));
      } else {
        setButtonOffset(16); // Reset to default offset
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    showLink && (
      <>
        <Link
          className="hidden fixed right-8 md:flex items-center text-base xs:text-lg sm:text-lg bg-darktext text-lighttext dark:bg-lighttext dark:text-darktext px-4 py-2 rounded-xl shadow-lg transition-opacity duration-[400ms]"
          style={{
            bottom: `${buttonOffset}px`,
            opacity: opacity,
          }}
          href={'#about'}
        >
          {t('right')} <ArrowUpToLine className="ml-2" />
        </Link>
        <Link
          className="lg:hidden fixed right-4 flex items-center text-base xs:text-lg sm:text-lg bg-darktext text-lighttext dark:bg-lighttext dark:text-darktext p-3 rounded-xl shadow-lg transition-opacity duration-[400ms]"
          style={{
            bottom: `${buttonOffset}px`,
            opacity: opacity,
          }}
          href={'#about'}
        >
          <ArrowUpToLine className="" />
        </Link>
      </>
    )
  );
}
