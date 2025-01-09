'use client'
import { create } from 'zustand';

interface LanguageState {
  isItalian: boolean;
  toggleLanguage: () => void;
}

const useLanguageStore = create<LanguageState>((set) => {
  // Detect system language or use localStorage if available
  const defaultIsItalian =
    typeof window !== 'undefined'
      ? localStorage.getItem('isItalian') !== null
        ? localStorage.getItem('isItalian') === 'true'
        : navigator.language.startsWith('it')
      : false;

  return {
    isItalian: defaultIsItalian,

    toggleLanguage: () => set((state) => {
      const newLanguage = !state.isItalian;
      localStorage.setItem('isItalian', newLanguage ? 'true' : 'false');
      return { isItalian: newLanguage };
    }),
  };
});

export default useLanguageStore;