import React from 'react'
import Image from 'next/image';
import ThemeToggle from '@components/ThemeToggle';
import logo from '@public/logo.svg';
import Link from 'next/link';
/* import LanguageSelector from '../Language-selector'; */

const Header = async () => {

  return (
    <div className='-mb-[66px] w-full'>
      <div className='flex justify-center items-center pt-5 mx-5'>
        <Link href={'/'} className='xl:mr-auto xl:mx-0 absolute xl:static left-1/2 transform -translate-x-1/2 space-x-5 xl:left-0 xl:-translate-x-0 xl:space-x-0'>
          <Image
            src={logo}
            width={200}
            height={100}
            className="dark:invert -mt-0.5 xl:w-[200px] w-[150px] transition-all duration-300"
            alt="logo"
          />
        </Link>

        <div className='hidden lg:flex text-2xl absolute left-1/2 transform -translate-x-1/2 space-x-5'>
          <Link href={'#skills'} className='px-3 transition-all hover:text-main'>Skills</Link>
          <Link href={'#portfolio'} className='px-3 transition-all hover:text-main'>Portfolio</Link>
          <Link href={'#blog'} className='px-3 transition-all hover:text-main'>Blog</Link>
          <Link href={'#contacts'} className='px-3 transition-all hover:text-main'>Contacts</Link>
        </div>

        <div className='ml-auto flex items-center'>
          {/* <LanguageSelector /> */}
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}

export default Header