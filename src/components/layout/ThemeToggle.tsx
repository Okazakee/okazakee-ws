'use client';

import useThemeStore from '@/store/themeStore';
import { SunMoon } from 'lucide-react';

export default function ThemeToggle() {
  const { toggleTheme } = useThemeStore();

  return (
    <button onClick={toggleTheme} className="rounded-md space-x-2 flex items-center">
      <SunMoon size={35} className='mr-2' />
      <span className='text-3xl'>
        Dark mode
      </span>
    </button>
  );
}