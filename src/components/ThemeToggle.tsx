'use client';

import useThemeStore from '../store/themeStore';
import Image from 'next/image';
import darkmodesvg from '@public/darkmode.svg'

export default function ThemeToggle() {
  const { toggleTheme } = useThemeStore();

  return (
    <button onClick={toggleTheme} className="p-2 rounded-md">
      <Image
        src={darkmodesvg}
        width={30}
        height={30}
        className='dark:invert'
        alt="darkmode"
      />
    </button>
  );
}