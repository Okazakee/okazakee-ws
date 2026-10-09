'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useLocaleSwitchStore } from '@/store/localeSwitchStore';

/**
 * Consumes the one-shot language-switch handoff after navigation.
 *
 * Holds a minimum document height while the target content commits so the
 * browser cannot clamp scroll to a briefly shorter page, then restores the
 * captured position exactly once (no smooth scrolling) and clears. Only the
 * matching destination consumes the handoff; ordinary navigation, reloads
 * and history traversal are untouched.
 */
export function LocaleScrollRestore() {
  const pathname = usePathname();

  useEffect(() => {
    const store = useLocaleSwitchStore.getState();
    const handoff = store.consumeSwitch(pathname);
    if (!handoff) {
      if (store.handoff && store.handoff.sourcePath !== pathname) {
        store.clearSwitch();
      }
      return;
    }

    document.documentElement.style.minHeight = handoff.previousMinHeight;
    window.scrollTo({
      left: handoff.x,
      top: handoff.y,
      behavior: 'instant',
    });
  }, [pathname]);

  return null;
}
