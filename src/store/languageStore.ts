'use client'
import { create } from 'zustand';

interface LanguageState {
  isDark: boolean;
  toggleLanguage: () => void;
}

const useLanguageStore = create<LanguageState>((set) => ({

  isDark: typeof window !== 'undefined' ? window.localStorage.getItem('isDark') === 'true' : true,

  toggleLanguage: () => set((state: { isDark: boolean }) => {

    const newTheme = !state.isDark;

    localStorage.setItem('isDark', newTheme ? 'true' : 'false');

    document.documentElement.classList.toggle('dark', newTheme);

    return { isDark: newTheme };
  }),

}));

export default useLanguageStore;