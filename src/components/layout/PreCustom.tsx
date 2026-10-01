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
        <span className="code-copy">
          <span
            className={`transition-opacity duration-300 ${
              copied ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {t('preCopy')}
          </span>
          <Copy
            className={`h-4 w-4 cursor-pointer transition-opacity duration-300 ${
              copied ? 'opacity-0' : 'opacity-100'
            }`}
            onClick={handleCopy}
          />
          <Check
            className={`h-4 w-4 cursor-pointer transition-opacity duration-300 ${
              copied ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={handleCopy}
          />
        </span>
      </div>
      <pre className="code-body">{children}</pre>
    </div>
  );
}
