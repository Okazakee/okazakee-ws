'use client';

import useThemeStore from '../store/themeStore';
import { SunMoon } from 'lucide-react';

export default function ThemeToggle() {
  const { toggleTheme } = useThemeStore();

  return (
    <button onClick={toggleTheme} className="rounded-md">
      <SunMoon size={30} className='md:hover:stroke-main' />
    </button>
  );
}