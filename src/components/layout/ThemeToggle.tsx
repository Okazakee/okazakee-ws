'use client';

import { useState, useEffect } from 'react';
import useThemeStore from '@/store/themeStore';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { toggleTheme, isDark } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="space-x-2 relative flex justify-center items-center border-2 border-darktext dark:border-lighttext rounded-xl transition-colors duration-[400ms] ease-in-out h-[4rem] w-[12rem] lg:h-10 lg:w-[9rem]"
    >
      <div className="relative w-[1.875rem] text-darktext dark:text-lighttext">
        <Sun
          size={30}
          className={`transition-all text-darktext duration-[400ms] ease-in-out absolute top-1/2 transform-gpu -translate-y-1/2 lg:w-5 lg:ml-2 ${isDark ? 'opacity-0' : 'opacity-100'}`}
        />
        <Moon
          size={30}
          className={`transition-all text-lighttext duration-[400ms] ease-in-out absolute top-1/2 transform-gpu -translate-y-1/2 lg:w-5 lg:ml-2 ${isDark ? 'opacity-100' : 'opacity-0'}`}
        />
      </div>
      <span
        className={`text-xl lg:text-[1rem] lg:-left-1.5 text-darktext dark:text-lighttext transition-all duration-[400ms] ease-in-out w-[8rem] relative ${isDark ? 'opacity-0' : 'opacity-100'}`}
      >
        Light Mode
      </span>
      <span
        className={`text-xl lg:text-[1rem] lg:left-2 text-darktext dark:text-lighttext transition-all duration-[400ms] ease-in-out w-[8rem] absolute right-3 ${isDark ? 'opacity-100' : 'opacity-0'}`}
      >
        Dark Mode
      </span>
    </button>
  );
}
