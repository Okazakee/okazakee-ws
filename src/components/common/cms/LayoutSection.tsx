'use client';

import { ChevronDown, ChevronUp, Eye, Globe, Save, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { i18nActions } from '@/app/actions/cms/sections/i18nActions';
import { ErrorDiv } from '../ErrorDiv';
import { PreviewModal } from './PreviewModal';
import { LayoutPreview } from './previews/LayoutPreview';

type FooterTranslations = {
  left: string;
  right: string;
  middle: string;
  source: string;
  darkmode: string;
  lightmode: string;
  buttonTitle: string;
  privacyPolicy: string;
};

type HeaderTranslations = {
  theme: string;
  language: string;
  settings: string;
  buttons: string[];
};

export default function LayoutSection() {
  const [footerTranslations, setFooterTranslations] = useState<{
    en: FooterTranslations;
    it: FooterTranslations;
  }>({
    en: {
      left: '',
      right: '',
      middle: '',
      source: '',
      darkmode: '',
      lightmode: '',
      buttonTitle: '',
      privacyPolicy: '',
    },
    it: {
      left: '',
      right: '',
      middle: '',
      source: '',
      darkmode: '',
      lightmode: '',
      buttonTitle: '',
      privacyPolicy: '',
    },
  });

  const [headerTranslations, setHeaderTranslations] = useState<{
    en: HeaderTranslations;
    it: HeaderTranslations;
  }>({
    en: {
      theme: '',
      language: '',
      settings: '',
      buttons: [],
    },
    it: {
      theme: '',
      language: '',
      settings: '',
      buttons: [],
    },
  });

  const [originalFooterTranslations, setOriginalFooterTranslations] =
    useState(footerTranslations);
  const [originalHeaderTranslations, setOriginalHeaderTranslations] =
    useState(headerTranslations);
  const [translationLocale, setTranslationLocale] = useState<'en' | 'it'>('en');
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    fetchTranslations();
  }, []);

  const fetchTranslations = async () => {
    setIsLoadingTranslations(true);
    try {
      const result = await i18nActions({ type: 'GET' });
      if (result.success && result.data) {
        const i18nData = result.data as Array<{
          language: string;
          translations: Record<string, unknown>;
        }>;

        const enData = i18nData.find((d) => d.language === 'en');
        const itData = i18nData.find((d) => d.language === 'it');

        const footerEn =
          (enData?.translations?.footer as FooterTranslations) || {};
        const footerIt =
          (itData?.translations?.footer as FooterTranslations) || {};

        const headerEn =
          (enData?.translations?.header as HeaderTranslations) || {};
        const headerIt =
          (itData?.translations?.header as HeaderTranslations) || {};

        const newFooterTranslations = {
          en: {
            left: footerEn.left || '',
            right: footerEn.right || '',
            middle: footerEn.middle || '',
            source: footerEn.source || '',
            darkmode: footerEn.darkmode || '',
            lightmode: footerEn.lightmode || '',
            buttonTitle: footerEn.buttonTitle || '',
            privacyPolicy: footerEn.privacyPolicy || '',
          },
          it: {
            left: footerIt.left || '',
            right: footerIt.right || '',
            middle: footerIt.middle || '',
            source: footerIt.source || '',
            darkmode: footerIt.darkmode || '',
            lightmode: footerIt.lightmode || '',
            buttonTitle: footerIt.buttonTitle || '',
            privacyPolicy: footerIt.privacyPolicy || '',
          },
        };

        const newHeaderTranslations = {
          en: {
            theme: headerEn.theme || '',
            language: headerEn.language || '',
            settings: headerEn.settings || '',
            buttons: Array.isArray(headerEn.buttons)
              ? [...headerEn.buttons]
              : [],
          },
          it: {
            theme: headerIt.theme || '',
            language: headerIt.language || '',
            settings: headerIt.settings || '',
            buttons: Array.isArray(headerIt.buttons)
              ? [...headerIt.buttons]
              : [],
          },
        };

        setFooterTranslations(newFooterTranslations);
        setHeaderTranslations(newHeaderTranslations);
        setOriginalFooterTranslations(newFooterTranslations);
        setOriginalHeaderTranslations(newHeaderTranslations);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch translations'
      );
    } finally {
      setIsLoadingTranslations(false);
    }
  };

  const hasChanges = () => {
    return (
      JSON.stringify(footerTranslations) !==
        JSON.stringify(originalFooterTranslations) ||
      JSON.stringify(headerTranslations) !==
        JSON.stringify(originalHeaderTranslations)
    );
  };

  const handleCancel = () => {
    setFooterTranslations(originalFooterTranslations);
    setHeaderTranslations(originalHeaderTranslations);
    setError(null);
  };

  const handleApply = async () => {
    if (!hasChanges()) return;

    setIsUpdating(true);
    setError(null);

    try {
      // Fetch existing translations first to preserve other sections
      const getResult = await i18nActions({ type: 'GET' });
      if (!getResult.success || !getResult.data) {
        throw new Error('Failed to fetch existing translations');
      }

      const i18nData = getResult.data as Array<{
        language: string;
        translations: Record<string, unknown>;
      }>;

      // Update footer and header for both locales
      for (const item of i18nData) {
        const locale = item.language;

        // Update footer
        const footerUpdateResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: locale,
          sectionKey: 'footer',
          sectionData:
            locale === 'en' ? footerTranslations.en : footerTranslations.it,
        });

        if (!footerUpdateResult.success) {
          throw new Error(
            footerUpdateResult.error || 'Failed to update footer translations'
          );
        }

        // Update header
        const headerUpdateResult = await i18nActions({
          type: 'UPDATE_SECTION',
          locale: locale,
          sectionKey: 'header',
          sectionData:
            locale === 'en' ? headerTranslations.en : headerTranslations.it,
        });

        if (!headerUpdateResult.success) {
          throw new Error(
            headerUpdateResult.error || 'Failed to update header translations'
          );
        }
      }

      setOriginalFooterTranslations(footerTranslations);
      setOriginalHeaderTranslations(headerTranslations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update translations'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const updateFooterTranslation = (
    key: keyof FooterTranslations,
    value: string
  ) => {
    setFooterTranslations((prev) => ({
      ...prev,
      [translationLocale]: {
        ...prev[translationLocale],
        [key]: value,
      },
    }));
  };

  const updateHeaderTranslation = (
    key: keyof Omit<HeaderTranslations, 'buttons'>,
    value: string
  ) => {
    setHeaderTranslations((prev) => ({
      ...prev,
      [translationLocale]: {
        ...prev[translationLocale],
        [key]: value,
      },
    }));
  };

  const updateHeaderButton = (index: number, value: string) => {
    setHeaderTranslations((prev) => {
      const newButtons = [...prev[translationLocale].buttons];
      newButtons[index] = value;
      return {
        ...prev,
        [translationLocale]: {
          ...prev[translationLocale],
          buttons: newButtons,
        },
      };
    });
  };

  if (isLoadingTranslations) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lighttext2">Loading translations...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 mb-8 md:mb-0 lg:mt-0">
      <div className="mb-8">
        <h1 className="hidden lg:block text-4xl font-bold mb-4 text-center">
          Layout Translations
        </h1>
        <p className="text-lighttext2 text-center mb-8">
          Edit header and footer translations for English and Italian
        </p>
      </div>

      {error && <ErrorDiv>{error}</ErrorDiv>}

      {/* Action Buttons */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-darkgray hover:bg-darkergray text-lighttext font-medium rounded-lg transition-all duration-200 border border-lighttext2/20"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={!hasChanges() || isUpdating}
          className="flex items-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApply}
          disabled={!hasChanges() || isUpdating}
          className="flex items-center gap-2 px-6 py-3 bg-main hover:bg-secondary text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {isUpdating ? 'Applying...' : 'Apply Changes'}
        </button>
      </div>

      {/* Language Selector */}
      <div className="mb-6 flex justify-center gap-2">
        <button
          type="button"
          onClick={() => setTranslationLocale('en')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            translationLocale === 'en'
              ? 'bg-main text-white'
              : 'bg-darkergray text-lighttext hover:bg-darkgray'
          }`}
        >
          English
        </button>
        <button
          type="button"
          onClick={() => setTranslationLocale('it')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            translationLocale === 'it'
              ? 'bg-main text-white'
              : 'bg-darkergray text-lighttext hover:bg-darkgray'
          }`}
        >
          Italiano
        </button>
      </div>

      {/* Footer Translations */}
      <div className="mb-6 bg-darkergray rounded-lg p-4">
        <button
          type="button"
          onClick={() => setIsFooterExpanded(!isFooterExpanded)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Footer Translations</h2>
          </div>
          {isFooterExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {isFooterExpanded && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="footer-left-input"
                className="block text-sm font-medium mb-2"
              >
                Left
              </label>
              <input
                id="footer-left-input"
                type="text"
                value={footerTranslations[translationLocale].left}
                onChange={(e) =>
                  updateFooterTranslation('left', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="footer-right-input"
                className="block text-sm font-medium mb-2"
              >
                Right
              </label>
              <input
                id="footer-right-input"
                type="text"
                value={footerTranslations[translationLocale].right}
                onChange={(e) =>
                  updateFooterTranslation('right', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="footer-middle-input"
                className="block text-sm font-medium mb-2"
              >
                Middle
              </label>
              <input
                id="footer-middle-input"
                type="text"
                value={footerTranslations[translationLocale].middle}
                onChange={(e) =>
                  updateFooterTranslation('middle', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="footer-source-input"
                className="block text-sm font-medium mb-2"
              >
                Source
              </label>
              <input
                id="footer-source-input"
                type="text"
                value={footerTranslations[translationLocale].source}
                onChange={(e) =>
                  updateFooterTranslation('source', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="footer-button-title-input"
                className="block text-sm font-medium mb-2"
              >
                Button Title
              </label>
              <input
                id="footer-button-title-input"
                type="text"
                value={footerTranslations[translationLocale].buttonTitle}
                onChange={(e) =>
                  updateFooterTranslation('buttonTitle', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="footer-privacy-policy-input"
                className="block text-sm font-medium mb-2"
              >
                Privacy Policy
              </label>
              <input
                id="footer-privacy-policy-input"
                type="text"
                value={footerTranslations[translationLocale].privacyPolicy}
                onChange={(e) =>
                  updateFooterTranslation('privacyPolicy', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="footer-darkmode-input"
                className="block text-sm font-medium mb-2"
              >
                Dark Mode
              </label>
              <input
                id="footer-darkmode-input"
                type="text"
                value={footerTranslations[translationLocale].darkmode}
                onChange={(e) =>
                  updateFooterTranslation('darkmode', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="footer-lightmode-input"
                className="block text-sm font-medium mb-2"
              >
                Light Mode
              </label>
              <input
                id="footer-lightmode-input"
                type="text"
                value={footerTranslations[translationLocale].lightmode}
                onChange={(e) =>
                  updateFooterTranslation('lightmode', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
          </div>
        )}
      </div>

      {/* Header Translations */}
      <div className="mb-6 bg-darkergray rounded-lg p-4">
        <button
          type="button"
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          className="w-full flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Header Translations</h2>
          </div>
          {isHeaderExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>

        {isHeaderExpanded && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="header-theme-input"
                className="block text-sm font-medium mb-2"
              >
                Theme
              </label>
              <input
                id="header-theme-input"
                type="text"
                value={headerTranslations[translationLocale].theme}
                onChange={(e) =>
                  updateHeaderTranslation('theme', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="header-language-input"
                className="block text-sm font-medium mb-2"
              >
                Language
              </label>
              <input
                id="header-language-input"
                type="text"
                value={headerTranslations[translationLocale].language}
                onChange={(e) =>
                  updateHeaderTranslation('language', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <label
                htmlFor="header-settings-input"
                className="block text-sm font-medium mb-2"
              >
                Settings
              </label>
              <input
                id="header-settings-input"
                type="text"
                value={headerTranslations[translationLocale].settings}
                onChange={(e) =>
                  updateHeaderTranslation('settings', e.target.value)
                }
                className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
              />
            </div>
            <div>
              <div className="block text-sm font-medium mb-2">
                Navigation Buttons
              </div>
              <div className="space-y-2">
                {headerTranslations[translationLocale].buttons.map(
                  (button, index) => (
                    <input
                      key={index}
                      id={`header-button-${index}-input`}
                      type="text"
                      value={button}
                      onChange={(e) =>
                        updateHeaderButton(index, e.target.value)
                      }
                      placeholder={`Button ${index + 1}`}
                      className="w-full px-3 py-2 bg-darkgray border border-darktext rounded-lg text-lighttext"
                      aria-label={`Navigation button ${index + 1}`}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <PreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="Layout Preview"
        >
          <LayoutPreview
            footerTranslations={footerTranslations}
            headerTranslations={headerTranslations}
            locale={translationLocale}
          />
        </PreviewModal>
      )}
    </div>
  );
}
