'use client';

import { Check, Share } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { trackUmamiEvent } from '@/utils/analytics';

export default function ShareButton({
  url,
  buttonTitle,
  title,
  className,
}: {
  url: string;
  buttonTitle: string;
  title: string;
  className?: string;
}) {
  const t = useTranslations('posts-section');

  const [copied, setCopied] = useState(false);
  // Single reset timer: a new copy replaces the pending one, and unmount
  // clears it. Failure keeps current behavior (log only, no state flip).
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
      trackUmamiEvent('content-share', { method: 'clipboard' });
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Mobile opens the native share sheet; desktop keeps the copy affordance.
  const handleShare = async () => {
    if (window.matchMedia('(max-width: 767px)').matches && navigator.share) {
      try {
        await navigator.share({ title, url });
        trackUmamiEvent('content-share', { method: 'native' });
      } catch {
        // The user dismissed the native sheet; nothing to do.
      }
      return;
    }
    await handleCopy();
  };

  return (
    <button
      className={`relative inline-flex items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-card px-3 py-2 transition-colors hover:border-accent-violet/50 hover:text-accent-violet-light ${className}`}
      onClick={handleShare}
      title={buttonTitle}
      type="button"
    >
      <span
        className={`absolute right-full mr-2 text-xs whitespace-nowrap transition-opacity duration-300 ${
          copied ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {t('preCopy')}
      </span>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Share className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
