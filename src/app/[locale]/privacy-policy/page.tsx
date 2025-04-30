import { getPrivacyPolicy } from '@/utils/getData';
import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import React from 'react';
import type { Metadata } from 'next';
import MarkdownRenderer from '@/components/layout/MarkdownRenderer';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPolicy' });

  return {
    title: `${t('title')} | Okazakee`,
    description: t('description'),
  };
}

export default async function PrivacyPolicyPage({
  params,
}: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'privacyPolicy' });
  const privacyPolicy = await getPrivacyPolicy(locale);

  if (!privacyPolicy) {
    notFound();
  }

  return (
    <main className="flex flex-col items-center justify-center max-w-screen-2xl mx-auto px-5 py-16">
      <div className="w-full max-w-4xl">
        <h1 className="text-4xl font-bold mb-8 text-center">{t('title')}</h1>
        <div className="prose dark:prose-invert max-w-none">
          <MarkdownRenderer markdown={privacyPolicy} />
        </div>
      </div>
    </main>
  );
}
