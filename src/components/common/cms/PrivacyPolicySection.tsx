'use client';

import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import '@uiw/react-md-editor/markdown-editor.css';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import useThemeStore from '@/store/themeStore';

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false });

type PrivacyPolicyData = {
  language: string;
  translations: Record<string, unknown>;
  privacy_policy?: string;
};

export default function PrivacyPolicySection() {
  const t = useTranslations('cms');
  const { isDark } = useThemeStore();
  const [privacyPolicyData, setPrivacyPolicyData] = useState<
    PrivacyPolicyData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<'en' | 'it'>('en');
  const [editedPolicies, setEditedPolicies] = useState<Record<string, string>>(
    {}
  );
  const [originalPolicies, setOriginalPolicies] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    fetchPrivacyPolicyData();
  }, []);

  const fetchPrivacyPolicyData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await i18nActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || t('privacy.errorFetch'));
      }

      const i18nData = result.data as Array<{
        language: string;
        translations: Record<string, unknown>;
        privacy_policy?: string;
      }>;

      setPrivacyPolicyData(i18nData);

      const policies: Record<string, string> = {};
      for (const locale of i18nData) {
        policies[locale.language] = locale.privacy_policy || '';
      }
      setEditedPolicies(policies);
      setOriginalPolicies(policies);

      if (i18nData.length > 0) {
        setSelectedLocale(i18nData[0].language as 'en' | 'it');
      }
    } catch (error) {
      console.error('Error fetching privacy policy data:', error);
      setError(
        error instanceof Error ? error.message : t('privacy.errorFetch')
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentTranslations = (
    locale: 'en' | 'it'
  ): Record<string, unknown> => {
    const localeData = privacyPolicyData.find(
      (data) => data.language === locale
    );
    return (localeData?.translations as Record<string, unknown>) || {};
  };

  const hasChanges = () => {
    return Object.keys(editedPolicies).some(
      (locale) => editedPolicies[locale] !== originalPolicies[locale]
    );
  };

  const localeHasChanges = (locale: string) => {
    return editedPolicies[locale] !== originalPolicies[locale];
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const changedLocales = Object.keys(editedPolicies).filter(
        (locale) => editedPolicies[locale] !== originalPolicies[locale]
      );

      for (const locale of changedLocales) {
        const currentTranslations = getCurrentTranslations(
          locale as 'en' | 'it'
        );
        const result = await i18nActions({
          type: 'UPDATE',
          locale: locale as 'en' | 'it',
          data: {
            translations: currentTranslations,
            privacy_policy: editedPolicies[locale],
          },
        });

        if (!result.success) {
          throw new Error(
            result.error ||
              `Failed to update privacy policy for ${locale.toUpperCase()}`
          );
        }
      }

      await fetchPrivacyPolicyData();
      alert(t('privacy.successSave'));
    } catch (error) {
      console.error('Error updating privacy policy:', error);
      setError(error instanceof Error ? error.message : t('privacy.errorSave'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (!confirm(t('privacy.confirmCancel'))) {
      return;
    }
    setEditedPolicies(originalPolicies);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  return (
    <div className="md:mt-8 mb-8 md:mb-0 lg:mt-8">
      {error && (
        <div className="mb-6 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="hidden lg:block text-4xl font-bold text-main mb-4">
          {t('privacy.title')}
        </h1>
        <p className="text-gray-500 dark:text-lighttext2 text-lg mb-4">
          {t('privacy.subtitle')}
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges() || isSaving}
            onClick={handleCancel}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges() || isSaving}
            onClick={handleSave}
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('privacy.saveChanges')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor with integrated locale tabs */}
      <div className="bg-gray-100 dark:bg-darkergray rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center border-b border-lighttext2/20">
          {privacyPolicyData.map((data) => {
            const isActive = selectedLocale === data.language;
            const isDirty = localeHasChanges(data.language);
            return (
              <button
                type="button"
                key={data.language}
                onClick={() => setSelectedLocale(data.language as 'en' | 'it')}
                className={`relative flex items-center my-1 gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg mr-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-white dark:bg-darkestgray text-main border-b-2 border-main -mb-px'
                    : 'text-gray-500 dark:text-lighttext2 hover:text-darktext dark:hover:text-lighttext hover:bg-gray-200/50 dark:hover:bg-darkestgray/50'
                }`}
              >
                {data.language.toUpperCase()}
                {isDirty && (
                  <span className="w-1.5 h-1.5 rounded-full bg-main inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Editor */}
        <div data-color-mode={isDark ? 'dark' : 'light'}>
          <MDEditor
            value={editedPolicies[selectedLocale] ?? ''}
            onChange={(val) =>
              setEditedPolicies((prev) => ({
                ...prev,
                [selectedLocale]: val ?? '',
              }))
            }
            height={600}
            preview="live"
          />
        </div>
      </div>
    </div>
  );
}
