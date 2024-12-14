import Link from 'next/link';
import React from 'react';
import { ArrowUpToLine } from 'lucide-react';

export default function Footer() {
  return (
    <footer id='contacts' className="border-t border-darktext dark:border-lighttext">
      <div className="my-4 md:flex-row flex-col-reverse flex items-center justify-between relative mx-10">
        <div className="text-md md:my-0">
          Made with ❤️ by <label className='text-main'>Okazakee</label> | <Link href="https://github.com/Okazakee/okazakee-ws" className="hover:text-main text-left transition-colors">Source code</Link>
        </div>
        <p className="text-md md:absolute md:left-1/2 md:transform md:-translate-x-1/2 my-4 md:my-0">
          VAT IT - 02863310815
        </p>
        <Link className='flex text-lg' href={'#about'}>Go back up <ArrowUpToLine className='ml-2' /></Link>
      </div>
    </footer>
  );
};