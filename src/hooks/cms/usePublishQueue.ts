'use client';

import { useCallback } from 'react';
import { useLayoutStore } from '@/store/layoutStore';

interface PublishableSection {
  sectionKey: string;
  isDirty: boolean;
  changeCount: number;
  publish: () => Promise<string[]>;
}

interface UsePublishQueueReturn {
  pendingSections: string[];
  pendingCount: number;
  registerSection: (section: PublishableSection) => void;
  publishAll: () => Promise<{
    success: number;
    failed: { key: string; errors: string[] }[];
  }>;
}

export function usePublishQueue(): UsePublishQueueReturn {
  const publishQueue = useLayoutStore((s) => s.publishQueue);
  const registerPublishState = useLayoutStore(
    (s) => s.registerPublishState
  );
  const clearAllPublishState = useLayoutStore(
    (s) => s.clearAllPublishState
  );

  const publishableRef: { current: PublishableSection[] } = { current: [] };

  const pendingSections = Object.entries(publishQueue)
    .filter(([, state]) => state.isDirty)
    .map(([key]) => key);

  const pendingCount = Object.values(publishQueue).reduce(
    (sum, state) => sum + (state.isDirty ? state.changeCount : 0),
    0
  );

  const registerSection = useCallback(
    (section: PublishableSection) => {
      registerPublishState(section.sectionKey, {
        isDirty: section.isDirty,
        changeCount: section.changeCount,
        lastModified: Date.now(),
      });

      const existing = publishableRef.current.findIndex(
        (s) => s.sectionKey === section.sectionKey
      );
      if (existing >= 0) {
        publishableRef.current[existing] = section;
      } else {
        publishableRef.current.push(section);
      }
    },
    [registerPublishState]
  );

  const publishAll = useCallback(async () => {
    const results: {
      success: number;
      failed: { key: string; errors: string[] }[];
    } = { success: 0, failed: [] };

    for (const section of publishableRef.current) {
      if (!section.isDirty) continue;
      const errors = await section.publish();
      if (errors.length === 0) {
        results.success += 1;
      } else {
        results.failed.push({ key: section.sectionKey, errors });
      }
    }

    if (results.failed.length === 0) {
      clearAllPublishState();
    }

    return results;
  }, [clearAllPublishState]);

  return {
    pendingSections,
    pendingCount,
    registerSection,
    publishAll,
  };
}
