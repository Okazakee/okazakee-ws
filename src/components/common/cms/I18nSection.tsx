'use client';

import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import { FileText, Globe, Save } from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { ErrorDiv } from '../ErrorDiv';

type I18nData = {
  language: string;
  translations: Record<string, unknown>;
  privacy_policy?: string;
};

export default function I18nSection() {
  const [i18nData, setI18nData] = useState<I18nData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState('en');
  const [editedTranslations, setEditedTranslations] = useState<
    Record<string, unknown>
  >({});
  const [editedPrivacyPolicy, setEditedPrivacyPolicy] = useState('');

  useEffect(() => {
    fetchI18nData();
  }, []);

  const fetchI18nData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await i18nActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch i18n data');
      }

      setI18nData(result.data as I18nData[]);

      // Initialize with first locale's data
      if (result.data && (result.data as I18nData[]).length > 0) {
        const firstLocale = (result.data as I18nData[])[0];
        setSelectedLocale(firstLocale.language);
        setEditedTranslations(firstLocale.translations || {});
        setEditedPrivacyPolicy(firstLocale.privacy_policy || '');
      }
    } catch (error) {
      console.error('Error fetching i18n data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to fetch i18n data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocaleChange = (locale: string) => {
    const localeData = i18nData.find((data) => data.language === locale);
    if (localeData) {
      setSelectedLocale(locale);
      setEditedTranslations(localeData.translations || {});
      setEditedPrivacyPolicy(localeData.privacy_policy || '');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const result = await i18nActions({
        type: 'UPDATE',
        locale: selectedLocale,
        data: {
          translations: editedTranslations,
          privacy_policy: editedPrivacyPolicy,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update i18n data');
      }

      // Refresh data
      await fetchI18nData();
    } catch (error) {
      console.error('Error updating i18n data:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to update i18n data'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-main" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-main mb-4">
          I18n Strings Editor
        </h1>
        <p className="text-lighttext2 text-lg">
          Manage your website translations and content
        </p>
      </div>

      {/* Locale Selector */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">Select Language</h2>
        <div className="flex gap-4">
          {i18nData.map((data) => (
            <button
              type="button"
              key={data.language}
              onClick={() => handleLocaleChange(data.language)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                selectedLocale === data.language
                  ? 'bg-main text-white'
                  : 'bg-darkestgray text-lighttext hover:bg-darkgray'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              {data.language.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Translations Editor */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">Translations</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lighttext2">
            <Globe className="w-4 h-4" />
            <span>Translation strings for {selectedLocale.toUpperCase()}</span>
          </div>
          <textarea
            value={JSON.stringify(editedTranslations, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setEditedTranslations(parsed);
              } catch (error) {
                // Allow invalid JSON during typing
              }
            }}
            className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden resize-y min-h-[400px] font-mono text-sm"
            placeholder="Enter translations as JSON object..."
          />
        </div>
      </div>

      {/* Privacy Policy Editor */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4">Privacy Policy</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lighttext2">
            <FileText className="w-4 h-4" />
            <span>Markdown content for {selectedLocale.toUpperCase()}</span>
          </div>
          <textarea
            value={editedPrivacyPolicy}
            onChange={(e) => setEditedPrivacyPolicy(e.target.value)}
            className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden resize-y min-h-[400px]"
            placeholder="Enter privacy policy content in markdown format..."
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-3 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {error && (
        <div className="mt-6 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}
