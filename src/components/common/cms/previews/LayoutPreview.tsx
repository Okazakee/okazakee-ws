'use client';

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

interface LayoutPreviewProps {
  footerTranslations: {
    en: FooterTranslations;
    it: FooterTranslations;
  };
  headerTranslations: {
    en: HeaderTranslations;
    it: HeaderTranslations;
  };
  locale: 'en' | 'it';
}

export function LayoutPreview({
  footerTranslations,
  headerTranslations,
  locale,
}: LayoutPreviewProps) {
  // Note: We can't use useTranslations here because we're previewing edited translations
  // Instead, we'll use the passed translations directly

  const footer = footerTranslations[locale];
  const header = headerTranslations[locale];

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-8">
      {/* Header Preview */}
      <div className="bg-white dark:bg-darkergray rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Header Preview</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Navigation Buttons</h3>
            <div className="flex flex-wrap gap-2">
              {header.buttons.map((button, index) => (
                <button
                  key={index}
                  type="button"
                  className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90 transition-colors"
                >
                  {button}
                </button>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Settings Menu</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>{header.language}:</span>
                <span className="text-gray-500 dark:text-gray-400">
                  EN / IT
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>{header.theme}:</span>
                <span className="text-gray-500 dark:text-gray-400">
                  Auto / Light / Dark
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {header.settings}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Preview */}
      <div className="bg-white dark:bg-darkergray rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold mb-4">Footer Preview</h2>
        <footer className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            {/* Left Section */}
            <div className="text-sm">
              {footer.left}{' '}
              <button type="button" className="text-main hover:underline bg-transparent border-none p-0 cursor-default">
                Okazakee
              </button>{' '}
              |{' '}
              <button type="button" className="text-main hover:underline bg-transparent border-none p-0 cursor-default">
                {footer.source}
              </button>
            </div>

            {/* Middle Section */}
            <div className="text-sm">
              <button
                type="button"
                className="px-4 py-2 bg-main text-white rounded-lg hover:bg-main/90 transition-colors"
                title={footer.buttonTitle}
              >
                {footer.middle} - 02863310815
              </button>
            </div>

            {/* Right Section */}
            <div className="text-sm flex items-center gap-3">
              <button type="button" className="text-main hover:underline bg-transparent border-none p-0 cursor-default">
                CMS
              </button>
              <span className="text-gray-500">|</span>
              <button type="button" className="text-main hover:underline bg-transparent border-none p-0 cursor-default">
                {footer.privacyPolicy}
              </button>
            </div>
          </div>

          {/* Scroll Top Button Preview */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
              >
                <span>{footer.right}</span>
                <span>↑</span>
              </button>
            </div>
          </div>

          {/* Theme Toggle Labels */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex gap-4">
              <span>{footer.lightmode}</span>
              <span>{footer.darkmode}</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
