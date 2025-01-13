'use client';
import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

const useThemeStore = create<ThemeState>((set) => ({
  // Initialize the theme based on localStorage, otherwise use system preference
  isDark: typeof window !== 'undefined'
    ? localStorage.getItem('isDark') === 'true'
      ? true
      : (localStorage.getItem('isDark') === 'false'
        ? false
        : window.matchMedia('(prefers-color-scheme: dark)').matches)
    : false,

  toggleTheme: () => set((state) => {
    const newTheme = !state.isDark;
    localStorage.setItem('isDark', newTheme ? 'true' : 'false'); // Persist theme in localStorage
    document.documentElement.classList.toggle('dark', newTheme); // Apply theme to the document
    return { isDark: newTheme };
  }),
}));

// Detect system theme change and update accordingly
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemThemeChange = () => {
    if (localStorage.getItem('isDark') === null) {
      // Only change theme based on system preference if no user preference is set
      const systemPrefersDark = mediaQuery.matches;
      document.documentElement.classList.toggle('dark', systemPrefersDark);
    }
  };

  mediaQuery.addEventListener('change', handleSystemThemeChange);
  handleSystemThemeChange(); // Initial check when the page loads
}

export default useThemeStore;