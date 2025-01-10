import Link from 'next/link';
import React from 'react';
import { ArrowUpToLine } from 'lucide-react';
import CopyLinkButton from '../common/CopyButton';

export default function Footer() {

  return (
    <footer id='contacts' className="border-t border-darktext dark:border-lighttext">
      <div className="my-4 md:flex-row flex-col-reverse flex items-center justify-between relative mx-10 mdh:scale-[90%]">
        <div className="text-xs xs:text-base sm:text-base md:my-0">
          Made with ❤️ by <Link href="https://github.com/Okazakee/okazakee-ws" className='text-main'>Okazakee</Link> | <Link href="https://github.com/Okazakee/okazakee-ws" className="hover:text-main text-left transition-colors">Source code</Link>
        </div>

        <CopyLinkButton copyValue='02863310815' buttonTitle='Click to copy VAT number'>
          VAT IT - 02863310815
        </CopyLinkButton>

        <Link className='flex text-base xs:text-lg sm:text-lg' href={'#about'}>
          Go back up <ArrowUpToLine className='ml-2' />
        </Link>
      </div>
    </footer>
  );
}