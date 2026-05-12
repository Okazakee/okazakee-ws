'use client';

import { useTranslations } from 'next-intl';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSavedAt?: number | null;
}

function timeAgo(ms: number): string {
  const seconds = Math.floor((Date.now() - ms) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function SaveStatusIndicator({
  status,
  lastSavedAt,
}: SaveStatusIndicatorProps) {
  const t = useTranslations('cms');

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'idle' && (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
          <span className="text-amber-600 dark:text-amber-400">
            {t('common.unsavedChanges')}
          </span>
        </>
      )}
      {status === 'saving' && (
        <>
          <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <span className="text-gray-500 dark:text-lighttext2">
            {t('common.saving')}
          </span>
        </>
      )}
      {status === 'saved' && (
        <>
          <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0" />
          <span className="text-green-600 dark:text-green-400">
            {t('common.draftSaved')}
            {lastSavedAt ? ` · ${timeAgo(lastSavedAt)}` : ''}
          </span>
        </>
      )}
      {status === 'error' && (
        <>
          <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0" />
          <span className="text-red-500">{t('common.saveFailed')}</span>
        </>
      )}
    </div>
  );
}
