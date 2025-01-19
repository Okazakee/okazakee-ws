import Link from 'next/link';
import React from 'react';
import CopyLinkButton from '../common/CopyButton';
import { getTranslations } from 'next-intl/server';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

export default async function Footer() {

  const t = await getTranslations('footer');

  return (
    <footer className="border-t border-darktext dark:border-lighttext">
      <div className="py-4 lg:flex-row flex-col-reverse flex items-center lg:justify-between justify-center relative mx-auto max-w-screen-2xl">
        <div className="text-xs xs:text-base sm:text-base md:my-0 w-fit lg:ml-5">
          {t('left')} <Link href="https://github.com/Okazakee/okazakee-ws" className='text-main'>Okazakee</Link> | <Link href="https://github.com/Okazakee/okazakee-ws" className="hover:text-main text-xs xs:stext-sm md:text-base text-left transition-colors duration-0">{t('source')}</Link>
        </div>

        <CopyLinkButton className='lg:absolute lg:left-1/2 lg:transform-gpu lg:-translate-x-1/2' copyValue='02863310815' buttonTitle={t('buttonTitle')}>
          {t('middle')} - 02863310815
        </CopyLinkButton>

        <div className='lg:flex gap-5 hidden lg:mr-5'>
          <LanguageToggle />
          <ThemeToggle />
        </div>

      </div>
    </footer>
  );
}