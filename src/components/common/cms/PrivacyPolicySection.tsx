'use client';

import { Eye, FileText, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import { PreviewModal } from './PreviewModal';
import { PrivacyPolicyPreview } from './previews/PrivacyPolicyPreview';

type PrivacyPolicyData = {
  language: string;
  translations: Record<string, unknown>;
  privacy_policy?: string;
};

export default function PrivacyPolicySection() {
  const [privacyPolicyData, setPrivacyPolicyData] = useState<
    PrivacyPolicyData[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState<'en' | 'it'>('en');
  const [editedPrivacyPolicy, setEditedPrivacyPolicy] = useState('');
  const [originalPrivacyPolicy, setOriginalPrivacyPolicy] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchPrivacyPolicyData();
  }, []);

  const fetchPrivacyPolicyData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await i18nActions({ type: 'GET' });
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch privacy policy data');
      }

      const i18nData = result.data as Array<{
        language: string;
        translations: Record<string, unknown>;
        privacy_policy?: string;
      }>;

      setPrivacyPolicyData(i18nData);

      // Initialize with first locale's data
      if (i18nData.length > 0) {
        const firstLocale = i18nData[0];
        setSelectedLocale(firstLocale.language as 'en' | 'it');
        setEditedPrivacyPolicy(firstLocale.privacy_policy || '');
        setOriginalPrivacyPolicy(firstLocale.privacy_policy || '');
      }
    } catch (error) {
      console.error('Error fetching privacy policy data:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to fetch privacy policy data'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocaleChange = (locale: 'en' | 'it') => {
    const localeData = privacyPolicyData.find(
      (data) => data.language === locale
    );
    if (localeData) {
      setSelectedLocale(locale);
      setEditedPrivacyPolicy(localeData.privacy_policy || '');
      setOriginalPrivacyPolicy(localeData.privacy_policy || '');
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
    return editedPrivacyPolicy !== originalPrivacyPolicy;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Get current translations to preserve them
      const currentTranslations = getCurrentTranslations(selectedLocale);

      const result = await i18nActions({
        type: 'UPDATE',
        locale: selectedLocale,
        data: {
          translations: currentTranslations,
          privacy_policy: editedPrivacyPolicy,
        },
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update privacy policy');
      }

      // Refresh data
      await fetchPrivacyPolicyData();
      alert('Privacy policy updated successfully!');
    } catch (error) {
      console.error('Error updating privacy policy:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update privacy policy'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (
      !confirm(
        'Are you sure you want to cancel? All unsaved changes will be lost.'
      )
    ) {
      return;
    }
    setEditedPrivacyPolicy(originalPrivacyPolicy);
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
          Privacy Policy Editor
        </h1>
        <p className="text-lighttext2 text-lg mb-4">
          Manage your privacy policy content
        </p>
        <div className="flex justify-center gap-3 mt-4">
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-darkgray hover:bg-darkergray text-lighttext font-medium rounded-lg transition-all duration-200 border border-lighttext2/20"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasChanges() || isSaving}
            onClick={handleCancel}
          >
            Cancel
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
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Locale Selector */}
      <div className="bg-darkergray rounded-xl p-6 mb-6">
        <h2 className="text-2xl font-bold text-main mb-4">Select Language</h2>
        <div className="flex gap-4">
          {privacyPolicyData.map((data) => (
            <button
              type="button"
              key={data.language}
              onClick={() => handleLocaleChange(data.language as 'en' | 'it')}
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                selectedLocale === data.language
                  ? 'bg-main text-white'
                  : 'bg-darkestgray text-lighttext hover:bg-darkgray'
              }`}
            >
              {data.language.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Policy Editor */}
      <div className="bg-darkergray rounded-xl p-6">
        <h2 className="text-2xl font-bold text-main mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Privacy Policy Content
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-lighttext2">
            <FileText className="w-4 h-4" />
            <span>Markdown content for {selectedLocale.toUpperCase()}</span>
          </div>
          <textarea
            value={editedPrivacyPolicy}
            onChange={(e) => setEditedPrivacyPolicy(e.target.value)}
            className="w-full px-3 py-2 bg-darkestgray border border-lighttext2 rounded-lg text-lighttext focus:border-main focus:outline-hidden resize-y min-h-[500px] font-mono text-sm"
            placeholder="Enter privacy policy content in markdown format..."
          />
        </div>
      </div>

      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Privacy Policy Preview"
      >
        <PrivacyPolicyPreview
          markdown={editedPrivacyPolicy}
          locale={selectedLocale}
        />
      </PreviewModal>
    </div>
  );
}
