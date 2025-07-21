'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function LanguageToggle({
  compact = false,
}: {
  compact?: boolean;
}) {
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
    ? 'flex items-center justify-center border-2 border-main rounded-2xl transition-all duration-300 ease-in-out w-fit px-3 h-10'
    : 'space-x-2 relative flex justify-center items-center border-2 border-white dark:border-white rounded-2xl transition-all duration-300 ease-in-out h-[3rem] w-[10rem] lg:h-10 lg:w-32 lg:border-main';

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
        <div className="text-lg lg:text-lg text-darktext dark:text-lighttext transition-all duration-300 ease-in-out flex items-center justify-center w-full">
          {isItalian ? 'Italiano' : 'English'}
        </div>
      )}
    </button>
  );
}
