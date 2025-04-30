import { create } from 'zustand';

export type ThemeMode = 'auto' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean; // Computed property for backward compatibility
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void; // Keep for backward compatibility
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

  // Apply theme to document based on mode
  const applyTheme = (mode: ThemeMode) => {
    const isDark = isDarkActive(mode);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    return isDark;
  };

  // Initialize mode from localStorage or default to 'auto'
  const storedMode =
    typeof window !== 'undefined'
      ? (localStorage.getItem('themeMode') as ThemeMode)
      : null;
  const initialMode: ThemeMode =
    storedMode && ['auto', 'light', 'dark'].includes(storedMode)
      ? (storedMode as ThemeMode)
      : 'auto';

  // Initialize isDark based on mode
  const initialIsDark = applyTheme(initialMode);

  return {
    mode: initialMode,
    isDark: initialIsDark,

    setThemeMode: (newMode: ThemeMode) => {
      localStorage.setItem('themeMode', newMode);
      const isDark = applyTheme(newMode);
      set({ mode: newMode, isDark });
    },

    // For backward compatibility
    toggleTheme: () => {
      const { mode } = get();
      const newMode: ThemeMode = mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      const isDark = applyTheme(newMode);
      set({ mode: newMode, isDark });
    },
  };
});

// Listen for system theme changes when in auto mode
if (typeof window !== 'undefined') {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleSystemThemeChange = () => {
    const currentMode =
      (localStorage.getItem('themeMode') as ThemeMode) || 'auto';
    if (currentMode === 'auto') {
      const store = useThemeStore.getState();
      const isDark = mediaQuery.matches;
      document.documentElement.classList.toggle('dark', isDark);
      store.setThemeMode('auto'); // This will update the isDark state
    }
  };

  mediaQuery.addEventListener('change', handleSystemThemeChange);
  handleSystemThemeChange(); // Initial check
}

export default useThemeStore;
