'use client';

import useThemeStore from '../store/themeStore';
import { SunMoon } from 'lucide-react';

export default function ThemeToggle() {
  const { toggleTheme } = useThemeStore();

  return (
    <button onClick={toggleTheme} className="p-2 rounded-md transition-all hover:scale-110">
      <SunMoon size={30} />
    </button>
  );
}