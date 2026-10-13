'use client';

import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Copy-to-clipboard affordance for the footer VAT number (DESIGN.md §5.5):
 * plain text with the copy action and the title from the CMS translations —
 * no icon, the label itself confirms the copy.
 */
export default function CopyLinkButton({
  copyValue,
  buttonTitle,
  copiedLabel,
  className,
  children,
}: {
  copyValue: string;
  buttonTitle: string;
  copiedLabel?: string;
  className: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  // Single reset timer: a new copy replaces the pending one, and unmount
  // clears it. Failure keeps current behavior (log only, no state flip).
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      if (resetTimer.current !== null) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, [copyValue]);

  return (
    <button
      className={className}
      onClick={handleCopy}
      title={buttonTitle}
      type="button"
    >
      {copied && copiedLabel ? copiedLabel : children}
    </button>
  );
}
