'use client';

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';

const ShareClipboard = ({ url }: { url: string }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy: ", error);
    }
  };

  return (
    <div className="relative items-start flex gap-2">

      <span className={`absolute top-2 md:-left-[200px] -left-32 text-sm transition-all pointer-events-none ${isCopied ? 'opacity-100' : 'opacity-0'}`}>
        Link copied to clipboard!
      </span>

      <button
        onClick={handleCopyToClipboard}
        className={`hover:bg-main rounded-lg p-2 transition-colors ${isCopied && 'pointer-events-none'}`}
        aria-label="Copy link to clipboard"
      >
        <Share2 size={20} />
      </button>
    </div>
  );
};

export default ShareClipboard;