import { create } from 'zustand';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  initializeTheme: () => void;
}

const useThemeStore = create<ThemeState>((set, get) => {
  // Helper function to determine if dark mode is active
  const isDarkActive = (mode: ThemeMode): boolean => {
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    // For 'auto' mode, check system preference
    return (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  };

  // Initialize with safe defaults for SSR
  const initialMode: ThemeMode = 'auto';
  const initialIsDark = false; // Safe default for SSR

  return {
    mode: initialMode,
    isDark: initialIsDark,

    initializeTheme: () => {
      if (typeof window === 'undefined') return;

      // Get stored mode or default to 'auto'
      const storedMode = localStorage.getItem('themeMode') as ThemeMode;
      const mode: ThemeMode =
        storedMode && ['auto', 'light', 'dark'].includes(storedMode)
          ? storedMode
          : 'auto';

      const isDark = isDarkActive(mode);
      set({ mode, isDark });

      // Listen for system theme changes when in auto mode
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleSystemThemeChange = () => {
        const currentMode = get().mode;
        if (currentMode === 'auto') {
          const isDark = mediaQuery.matches;
          set({ isDark });
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
    },

    setThemeMode: (newMode: ThemeMode) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeMode', newMode);
      }
      const isDark = isDarkActive(newMode);
      set({ mode: newMode, isDark });
    },

    toggleTheme: () => {
      const { mode } = get();
      const newMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('themeMode', newMode);
      }
      const isDark = isDarkActive(newMode);
      set({ mode: newMode, isDark });
    },
  };
});

export default useThemeStore;
