'use client';

import type React from 'react';
import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function CopyLinkButton({
  copyValue,
  buttonTitle,
  className,
  children,
}: {
  copyValue: string;
  buttonTitle: string;
  className: string;
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
      type="button"
      onClick={handleCopy}
      className={`${className}  relative text-xs xs:text-base sm:text-base my-4 md:my-0 flex items-center gap-2 hover:text-main transition-all duration-0 group`}
      title={buttonTitle}
      data-umami-event="P.IVA Copy"
    >
      <span>{children}</span>
      <div className="absolute -right-6">
        {copied ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 " />
        )}
      </div>
    </button>
  );
}
