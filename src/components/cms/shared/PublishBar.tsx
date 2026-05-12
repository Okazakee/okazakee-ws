'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { SaveStatusIndicator } from './SaveStatusIndicator';
import type { SaveStatus } from './SaveStatusIndicator';

interface PublishBarProps {
  sectionKey?: string;
  isDirty: boolean;
  changeCount: number;
  saveStatus: SaveStatus;
  lastSavedAt?: number | null;
  onRevert: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
}

export function PublishBar({
  isDirty,
  changeCount,
  saveStatus,
  lastSavedAt,
  onRevert,
  onPublish,
  isPublishing = false,
}: PublishBarProps) {
  const t = useTranslations('cms');

  return (
    <div
      className={`sticky bottom-0 z-20 mt-6 -mx-4 md:-mx-6 lg:-mx-8 px-4 md:px-6 lg:px-8 py-3 border-t transition-colors ${
        isDirty
          ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
          : 'bg-gray-50 dark:bg-darkergray border-gray-200 dark:border-darkgray'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        <SaveStatusIndicator status={saveStatus} lastSavedAt={lastSavedAt} />

        {isDirty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRevert}
              disabled={isPublishing}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              {t('common.revert')}
            </button>
            <button
              type="button"
              onClick={onPublish}
              disabled={isPublishing}
              className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-main hover:bg-secondary text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isPublishing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('common.publishing')}
                </>
              ) : (
                <>
                  {t('common.publishChanges')}
                  {changeCount > 0 && (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                      {changeCount}
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        )}

        {!isDirty && (
          <span className="text-xs text-gray-400 dark:text-lighttext2">
            {t('common.allChangesPublished')}
          </span>
        )}
      </div>
    </div>
  );
}
