'use client';

import useLanguageStore from '@/store/languageStore';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { toggleLanguage } = useLanguageStore();

  return (
    <button onClick={toggleLanguage} className="rounded-md space-x-2 flex items-center">
      <Languages size={35} className='mr-2' />
      <span className='text-3xl'>
        Language
      </span>
    </button>
  );
}