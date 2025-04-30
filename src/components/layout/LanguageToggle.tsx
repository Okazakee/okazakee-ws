'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function LanguageToggle({
  compact = false,
}: { compact?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const isItalian = pathname.startsWith('/it');

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLanguage = useCallback(() => {
    const newLocale = isItalian ? 'en' : 'it';
    const pathSegments = pathname.split('/');
    pathSegments[1] = newLocale;
    const newPath = pathSegments.join('/');

    // Use window.location.href for a full page refresh instead of client-side navigation
    window.location.href = newPath;
  }, [pathname, isItalian]);

  if (!mounted) return null;

  // Use compact styling when in desktop header
  const buttonClass = compact
    ? 'flex items-center justify-center border-2 border-main rounded-2xl transition-all duration-300 ease-in-out w-[38px] h-[30px] hover:scale-105'
    : 'space-x-2 relative flex justify-center items-center border-2 border-main rounded-2xl transition-all duration-300 ease-in-out h-[4rem] w-[12rem] lg:h-10 lg:w-32 hover:scale-105';

  return (
    <button
      type="button"
      onClick={switchLanguage}
      className={buttonClass}
      data-umami-event="Language toggle"
    >
      {compact ? (
        <span className="text-sm font-medium text-darktext dark:text-lighttext transition-all duration-300 ease-in-out">
          {isItalian ? 'IT' : 'EN'}
        </span>
      ) : (
        <>
          <div className="relative w-[1.8rem]">
            <Languages
              size={30}
              strokeWidth={0}
              className="transition-all text-darktext dark:text-lighttext duration-300 ease-in-out absolute top-1/2 transform-gpu -translate-y-1/2 lg:w-5 lg:ml-2"
            />
          </div>
          <div className="text-xl lg:text-lg text-darktext dark:text-lighttext transition-all duration-300 ease-in-out w-[7rem] flex items-center pointer-events-none">
            <span
              className={`absolute -left-2 transform-gpu translate-x-[100%] transition-opacity duration-300 ease-in-out lg:translate-x-11 ${
                isItalian ? 'opacity-0' : 'opacity-100'
              }`}
            >
              English
            </span>
            <span
              className={`absolute -left-6 md:-left-2 md:text-[1rem] transform-gpu translate-x-[100%] transition-opacity duration-300 ease-in-out lg:translate-x-11 ${
                isItalian ? 'opacity-100' : 'opacity-0'
              }`}
            >
              Italiano
            </span>
          </div>
        </>
      )}
    </button>
  );
}
