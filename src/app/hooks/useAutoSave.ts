import { useCallback, useEffect, useRef } from 'react';

interface UseAutoSaveOptions {
  data: any;
  onSave: () => Promise<void>;
  interval?: number; // in milliseconds
  enabled?: boolean;
}

export function useAutoSave({ data, onSave, interval = 30000, enabled = true }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef<any>();
  const isSavingRef = useRef(false);

  const save = useCallback(async () => {
    if (isSavingRef.current) return;
    
    try {
      isSavingRef.current = true;
      await onSave();
      lastSavedRef.current = JSON.stringify(data);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, onSave]);

  useEffect(() => {
    if (!enabled) return;

    const currentDataString = JSON.stringify(data);
    
    // Only auto-save if data has changed
    if (lastSavedRef.current !== currentDataString) {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        save();
      }, interval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, interval, enabled, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    save,
    isSaving: isSavingRef.current,
  };
}
