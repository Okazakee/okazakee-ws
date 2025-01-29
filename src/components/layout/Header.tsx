import React from 'react';
import Image from 'next/image';
import logo from '@public/logo.svg';
import Link from 'next/link';
import NavMenu from './NavMenu';
import { getResumeLink } from '@/utils/getData';

export default async function Header({ locale }: { locale: string }) {
  const resume = await getResumeLink(locale);

  return (
    <header className="max-w-screen-2xl mx-auto pt-2">
      <div className="flex justify-between items-center pt-5 mx-5">
        <Link href={'/'} className="xl:mr-auto xl:mx-0 xl:static">
          <Image
            src={logo}
            width={200}
            height={100}
            priority
            sizes="(min-width: 1280px) 200px, (min-width: 475px) 160px, 130px"
            className="dark:invert -mt-0.5 xl:w-[200px] w-[130px] xs:w-[160px] transition-all duration-[400ms] ease-in-out"
            alt="logo"
          />
        </Link>

        <NavMenu locale={locale} resumeLink={resume!} />
      </div>
    </header>
  );
}
