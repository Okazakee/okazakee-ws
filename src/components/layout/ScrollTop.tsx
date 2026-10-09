'use client';

import { Glitch } from '@/components/common/Glitch';
import { ArrowUpToLine } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export default function ScrollTop() {
  const [showLink, setShowLink] = useState(false);
  const [buttonOffset, setButtonOffset] = useState(16); // Initial offset from bottom in px
  const [opacity, setOpacity] = useState(0); // Start with opacity 0
  const t = useTranslations('footer');

  const handleScroll = useCallback(() => {
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
      setButtonOffset(
        Math.max(16, 100 - (totalHeight - (scrollY + viewportHeight)))
      );
    } else {
      setButtonOffset(16); // Reset to default offset
    }
  }, []);

  // A locale switch remounts this subtree with fresh state, so derive the
  // initial state from the live scroll position instead of waiting for the
  // next scroll event: the layout pass covers a position the browser kept
  // across the switch, and the effect below re-runs after
  // LocaleScrollRestore (rendered earlier, same commit) has restored its
  // captured position.
  useLayoutEffect(() => {
    handleScroll();
  }, [handleScroll]);

  useEffect(() => {
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    showLink && (
      <Glitch
        className="fixed right-4 z-40 md:right-8"
        hoverPreset="backToTop"
        mode="both"
        style={{
          bottom: `${buttonOffset}px`,
          opacity: opacity,
        }}
      >
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-text-main p-3 font-mono text-xs uppercase tracking-[0.08em] text-surface-base shadow-lg transition-colors duration-300 hover:bg-accent-violet hover:text-text-on-accent md:px-4 md:py-2"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <span className="hidden md:inline">{t('right')}</span>
          <ArrowUpToLine className="h-4 w-4" />
        </button>
      </Glitch>
    )
  );
}
