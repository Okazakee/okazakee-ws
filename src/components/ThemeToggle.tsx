'use client';

import useThemeStore from '../store/themeStore';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <button onClick={toggleTheme} className="p-2 rounded-md">
      {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      <label>{isDark ? ' dark' : ' light'}</label>
    </button>
  );
}