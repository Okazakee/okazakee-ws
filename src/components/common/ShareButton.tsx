'use client';

import { Check, Share2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      className={`relative inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-dim transition-colors hover:border-accent-violet/50 hover:text-accent-violet-light ${className}`}
      data-umami-event="Share button"
      data-umami-event-post={title}
      onClick={handleCopy}
      title={buttonTitle}
      type="button"
    >
      <span
        className={`absolute right-full mr-2 whitespace-nowrap text-xs transition-opacity duration-300 ${
          copied ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {t('preCopy')}
      </span>
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Share2 className="h-4 w-4" />
      )}
    </button>
  );
}
