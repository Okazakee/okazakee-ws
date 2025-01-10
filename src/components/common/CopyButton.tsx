'use client'

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyLinkButton({
  copyValue,
  buttonTitle,
  children,
}: {
  copyValue: string;
  buttonTitle: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-xs xs:text-base sm:text-base md:absolute md:left-1/2 md:transform md:-translate-x-1/2 my-4 md:my-0 flex items-center gap-2 hover:text-main transition-colors group"
      title={buttonTitle}
    >
      <span>{children}</span>
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
      )}
    </button>
  );
}