'use client';

import { useLayoutEffect } from 'react';
import {
  type LocaleAlternates,
  useLocaleSwitchStore,
} from '@/store/localeSwitchStore';

/**
 * Publishes canonical per-locale destinations for the language switch.
 * The header switcher sits above the page in the tree, so alternates ride
 * on the shared switch store rather than a context the header cannot see.
 */
export function PublishLocaleAlternates({
  alternates,
}: {
  alternates: LocaleAlternates;
}) {
  const publishAlternates = useLocaleSwitchStore(
    (state) => state.publishAlternates
  );

  useLayoutEffect(() => {
    publishAlternates(alternates);
    return () => {
      if (useLocaleSwitchStore.getState().alternates === alternates) {
        publishAlternates(null);
      }
    };
  }, [alternates, publishAlternates]);

  return null;
}
