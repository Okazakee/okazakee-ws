'use client';

import { Glitch } from '@components/common/Glitch';
import { Moon, Smartphone, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import useThemeStore, { type ThemeMode } from '@/store/themeStore';

/**
 * Header theme control (docs/DESIGN.md §4): cycles auto → light → dark from a
 * single icon button. The store owns persistence and the system-preference
 * listener, so the component only reflects `mode` and calls `setThemeMode`.
 *
 * The icon carries the click glitch (`docs/DESIGN.md` §3) — this is the site's
 * in-place button: a click toggles the theme instead of navigating, so the
 * burst is always seen. `trigger="group"` fires it from the whole button, not
 * just the 18px of art inside its 44px touch target.
 */
export default function ThemeToggle({ ariaLabel }: { ariaLabel?: string }) {
  const { mode, setThemeMode } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const Icon = mode === 'light' ? Sun : mode === 'dark' ? Moon : Smartphone;

  // Cycle through modes: auto -> light -> dark -> auto
  const cycleThemeMode = () => {
    const modes: ThemeMode[] = ['auto', 'light', 'dark'];
    const currentIndex = modes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  return (
    <button
      aria-label={ariaLabel}
      className="group flex h-11 w-11 items-center justify-center rounded-lg border border-border-subtle bg-surface-card text-text-dim transition-colors hover:border-accent-violet/40 hover:text-accent-violet-light lg:h-auto lg:w-auto lg:p-1.5"
      data-umami-event="Theme toggle"
      onClick={cycleThemeMode}
      type="button"
    >
      <Glitch mode="click" trigger="group">
        <Icon
          className="h-[18px] w-[18px] lg:h-[17px] lg:w-[17px]"
          strokeWidth={2}
        />
      </Glitch>
    </button>
  );
}
