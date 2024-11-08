import React from 'react'
import Image from 'next/image';
import ThemeToggle from './ThemeToggle';
import logo from './../app/public/logo.svg';
import Link from 'next/link';

const Header = async () => {

  return (
    <div className='flex justify-center items-center pt-5 px-10 mb-20'>
      <div className='mr-auto'>
        <Image
          src={logo}
          width={200}
          height={100}
          className="dark:invert -mt-1"
          alt="logo"
        />
      </div>

      <div className='hidden lg:flex text-2xl absolute left-1/2 transform -translate-x-1/2 space-x-5'>
        <Link href={'#aboutme'} className='px-3 hover:text-main'>About</Link>
        <Link href={'#skills'} className='px-3 hover:text-main'>Skills</Link>
        <Link href={'#portfolio'} className='px-3 hover:text-main'>Portfolio</Link>
        <Link href={'#blog'} className='px-3 hover:text-main'>Blog</Link>
        <Link href={'#contacts'} className='px-3 hover:text-main'>Contacts</Link>
      </div>

      <div className='ml-auto'>
        <ThemeToggle />
      </div>
    </div>
  )
}

export default Header