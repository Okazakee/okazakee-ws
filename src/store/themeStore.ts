'use client'
import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>((set) => ({

  isDark: typeof window !== 'undefined' ? window.localStorage.getItem('isDark') === 'true' : true,

  toggleTheme: () => set((state: { isDark: boolean }) => {

    const newTheme = !state.isDark;

    localStorage.setItem('isDark', newTheme ? 'true' : 'false');

    document.documentElement.classList.toggle('dark', newTheme);

    return { isDark: newTheme };
  }),

}));

export default useThemeStore;
