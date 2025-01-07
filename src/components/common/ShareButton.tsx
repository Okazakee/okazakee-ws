'use client'

import React, { useState } from 'react';
import { Check, Share2 } from 'lucide-react';

export default function ShareButton({
  url,
  buttonTitle,
}: {
  url: string;
  buttonTitle: string;
}) {
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
      onClick={handleCopy}
      className={`relative flex items-center gap-2 px-2 py-1 rounded-md transition-all duration-300 
      ${copied ? 'w-[6rem]' : 'w-5'}`}
      title={buttonTitle}
    >
      <Check
        className={`w-5 h-5 text-green-500 transition-opacity duration-300 ${
          copied ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span
        className={`text-sm transition-opacity duration-200 ${
          copied ? 'opacity-100' : 'opacity-0'
        }`}
      >
        Copied!
      </span>

      {!copied && (
        <Share2 className="absolute left-1/2 transform -translate-x-1/2 w-5 h-5 opacity-100" />
      )}
    </button>
  );
}
