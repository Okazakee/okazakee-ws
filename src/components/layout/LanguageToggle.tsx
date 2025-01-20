'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Languages } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function LanguageToggle() {
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

    router.push(newPath);
  }, [pathname, router, isItalian]);

  if (!mounted) return null;

  return (
    <button
      onClick={switchLanguage}
      className="space-x-2 relative flex justify-center items-center border-2 border-darktext dark:border-lighttext rounded-xl transition-colors duration-[400ms] ease-in-out h-[4rem] w-[12rem] lg:h-10 lg:w-32"
    >
      <div className="relative w-[1.8rem]">
        <Languages
          size={30}
          className="transition-all text-darktext dark:text-lighttext duration-[400ms] ease-in-out absolute top-1/2 transform-gpu -translate-y-1/2 lg:w-5 lg:ml-2"
        />
      </div>
      <div className="text-xl lg:text-lg text-darktext dark:text-lighttext transition-all duration-[400ms] ease-in-out w-[7rem] flex items-center pointer-events-none">
        <span
          className={`absolute -left-2 transform-gpu translate-x-[100%] transition-opacity duration-[400ms] ease-in-out lg:translate-x-11 ${
            isItalian ? 'opacity-0' : 'opacity-100'
          }`}
        >
          English
        </span>
        <span
          className={`absolute -left-2 transform-gpu translate-x-[100%] transition-opacity duration-[400ms] ease-in-out lg:translate-x-11 ${
            isItalian ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Italiano
        </span>
      </div>
    </button>
  );
}