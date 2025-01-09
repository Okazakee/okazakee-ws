'use client';
import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>((set) => ({
  isDark: typeof window !== 'undefined'
    ? (window.localStorage.getItem('isDark') === 'true' ? true : (window.matchMedia('(prefers-color-scheme: dark)').matches ? true : false))
    : false, // Default to system theme when no localStorage or system preference is available

  toggleTheme: () => set((state: { isDark: boolean }) => {
    const newTheme = !state.isDark;
    localStorage.setItem('isDark', newTheme ? 'true' : 'false');
    document.documentElement.classList.toggle('dark', newTheme);
    return { isDark: newTheme };
  }),
}));

// Detect system theme change and update accordingly
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQuery.addEventListener('change', () => {
    // Remove the 'isDark' item from localStorage when system theme changes
    localStorage.removeItem('isDark');
    // Check system preference and update the theme
    const systemPrefersDark = mediaQuery.matches;
    document.documentElement.classList.toggle('dark', systemPrefersDark);
  });
}

export default useThemeStore;