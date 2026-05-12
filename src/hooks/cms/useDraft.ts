'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLayoutStore } from '@/store/layoutStore';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseDraftOptions<T> {
  sectionKey: string;
  initial: T;
  serverData: T;
  onPublish: (draft: T) => Promise<string[]>;
}

interface UseDraftReturn<T> {
  draft: T;
  setDraft: (updater: T | ((prev: T) => T)) => void;
  isDirty: boolean;
  changeCount: number;
  saveStatus: SaveStatus;
  saveDraft: () => void;
  publishChanges: () => Promise<string[]>;
  revertAll: () => void;
  resetAfterPublish: (data: T) => void;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getStorageKey(sectionKey: string): string {
  const { user } = useLayoutStore.getState();
  const userId = user?.id ?? 'anonymous';
  return `cms-draft-${sectionKey}-${userId}`;
}

export function useDraft<T>({
  sectionKey,
  initial,
  serverData,
  onPublish,
}: UseDraftOptions<T>): UseDraftReturn<T> {
  const registerPublishState = useLayoutStore(
    (s) => s.registerPublishState
  );
  const unregisterPublishState = useLayoutStore(
    (s) => s.unregisterPublishState
  );

  const [draft, setDraftState] = useState<T>(initial);
  const originalRef = useRef<T>(deepClone(serverData));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storageKey = getStorageKey(sectionKey);

  const isDirty = !deepEqual(draft, originalRef.current);

  const countChanges = useCallback((d: T, o: T): number => {
    const dStr = JSON.stringify(d);
    const oStr = JSON.stringify(o);
    if (dStr === oStr) return 0;
    return 1;
  }, []);

  const changeCount = isDirty ? countChanges(draft, originalRef.current) : 0;

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    registerPublishState(sectionKey, {
      isDirty,
      changeCount,
      lastModified: Date.now(),
    });
    return () => {
      unregisterPublishState(sectionKey);
    };
  }, [sectionKey, isDirty, changeCount, registerPublishState, unregisterPublishState]);

  const persistToStorage = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ draft: data, timestamp: Date.now() })
        );
        setLastSavedAt(Date.now());
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      }
    },
    [storageKey]
  );

  const setDraft = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setDraftState((prev) => {
        const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          persistToStorage(next);
        }, 2000);
        setSaveStatus('idle');
        return next;
      });
    },
    [persistToStorage]
  );

  const saveDraft = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setSaveStatus('saving');
    persistToStorage(draft);
  }, [draft, persistToStorage]);

  const publishChanges = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const errors = await onPublish(draft);
      if (errors.length === 0) {
        originalRef.current = deepClone(draft);
        setSaveStatus('saved');
        localStorage.removeItem(storageKey);
      } else {
        setSaveStatus('error');
      }
      return errors;
    } catch {
      setSaveStatus('error');
      return ['An unexpected error occurred during publish'];
    }
  }, [draft, onPublish, storageKey]);

  const revertAll = useCallback(() => {
    const original = deepClone(originalRef.current);
    setDraftState(original);
    setSaveStatus('idle');
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const resetAfterPublish = useCallback(
    (data: T) => {
      originalRef.current = deepClone(data);
      setDraftState(data);
      setSaveStatus('idle');
      localStorage.removeItem(storageKey);
    },
    [storageKey]
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { draft: T; timestamp: number };
        if (parsed.timestamp > (lastSavedAt ?? 0)) {
          setDraftState(parsed.draft);
        }
      }
    } catch {
      // ignore corrupt storage
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    draft,
    setDraft,
    isDirty,
    changeCount,
    saveStatus,
    saveDraft,
    publishChanges,
    revertAll,
    resetAfterPublish,
  };
}
