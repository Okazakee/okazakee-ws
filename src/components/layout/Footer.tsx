import Link from 'next/link';
import React from 'react';
import CopyLinkButton from '../common/CopyButton';
import { getTranslations } from 'next-intl/server';
import LanguageToggle from './LanguageToggle';
import ThemeToggle from './ThemeToggle';

export default async function Footer() {

  const t = await getTranslations('footer');

  return (
    <footer id='contacts' className="border-t border-darktext dark:border-lighttext">
      <div className="my-4 md:flex-row flex-col-reverse flex items-center justify-between relative mx-10">
        <div className="text-xs xs:text-base sm:text-base md:my-0">
          {t('left')} <Link href="https://github.com/Okazakee/okazakee-ws" className='text-main'>Okazakee</Link> | <Link href="https://github.com/Okazakee/okazakee-ws" className="hover:text-main text-xs xs:stext-sm md:text-base text-left transition-colors">{t('source')}</Link>
        </div>

        <CopyLinkButton copyValue='02863310815' buttonTitle={t('buttonTitle')}>
          {t('middle')} - 02863310815
        </CopyLinkButton>

      <div className='md:flex gap-5 hidden'>
        <LanguageToggle />
        <ThemeToggle />
      </div>

      </div>
    </footer>
  );
}