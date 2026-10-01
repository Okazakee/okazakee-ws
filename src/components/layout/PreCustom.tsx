'use client';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type React from 'react';
import { useState } from 'react';

export type PreChild = React.ReactElement & {
  props: {
    children: string;
  };
};

interface PreCustomProps {
  children: PreChild;
}

export default function PreCustom({ children }: PreCustomProps) {
  const t = useTranslations('posts-section');

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children?.props.children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="code-block">
      <div className="code-head">
        <span className="code-lang">Code</span>
        <button
          aria-label={t('preCopy')}
          className="code-copy"
          onClick={handleCopy}
          type="button"
        >
          {copied && <span className="text-[0.7rem]">{t('preCopy')}</span>}
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <pre className="code-body">{children}</pre>
    </div>
  );
}
