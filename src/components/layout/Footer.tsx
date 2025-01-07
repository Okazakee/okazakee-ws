'use client'

import Link from 'next/link';
import React, { useState } from 'react';
import { ArrowUpToLine, Check, Copy } from 'lucide-react';

export default function Footer() {
  const [copied, setCopied] = useState(false);
  const vatNumber = "02863310815";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(vatNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <footer id='contacts' className="border-t border-darktext dark:border-lighttext">
      <div className="my-4 md:flex-row flex-col-reverse flex items-center justify-between relative mx-10">
        <div className="text-md md:my-0">
          Made with ❤️ by <Link href="https://github.com/Okazakee/okazakee-ws" className='text-main'>Okazakee</Link> | <Link href="https://github.com/Okazakee/okazakee-ws" className="hover:text-main text-left transition-colors">Source code</Link>
        </div>
        <button
          onClick={handleCopy}
          className="text-md md:absolute md:left-1/2 md:transform md:-translate-x-1/2 my-4 md:my-0 flex items-center gap-2 hover:text-main transition-colors group"
          title="Click to copy VAT number"
        >
          <span>VAT IT - {vatNumber}</span>
          {copied ? (
            <Check className="w-4 h-4 text-green-500" />
          ) : (
            <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </button>
        <Link className='flex text-lg' href={'#about'}>
          Go back up <ArrowUpToLine className='ml-2' />
        </Link>
      </div>
    </footer>
  );
}