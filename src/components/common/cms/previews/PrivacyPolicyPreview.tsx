'use client';

import MarkdownRenderer from '@/components/layout/MarkdownRenderer';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import React from 'react';

interface PrivacyPolicyPreviewProps {
  markdown: string;
  locale: 'en' | 'it';
}

export function PrivacyPolicyPreview({ markdown, locale }: PrivacyPolicyPreviewProps) {
  const pathname = usePathname();
  const pathLocale = pathname.split('/')[1] || locale;
  const t = useTranslations('privacyPolicy');

  return (
    <main className="flex flex-col items-center justify-center max-w-(--breakpoint-2xl) mx-auto px-5 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">{t('title')}</h1>
        <div className="prose dark:prose-invert max-w-none">
          <MarkdownRenderer markdown={markdown} />
        </div>
      </div>
    </main>
  );
}
