'use client';

import { ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StateCard } from '@/components/common/StateCard';

export default function GlobalNotFound() {
  const t = useTranslations('errors');

  return (
    <StateCard
      code={t('code')}
      hint={t('notFoundLabel')}
      label="not-found.log"
      text={t('notFoundText')}
      title={t('notFoundTitle')}
    >
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-5 py-2.5 font-mono text-xs tracking-[0.08em] text-text-main uppercase transition-colors hover:border-accent-violet/50 hover:text-text-white"
        onClick={() => window.history.back()}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('goBack')}
      </button>
      <Link
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-violet px-5 py-2.5 font-mono text-xs tracking-[0.08em] text-surface-base uppercase transition-colors hover:bg-accent-violet-light"
        href="/"
      >
        <Home className="h-4 w-4" />
        {t('home')}
      </Link>
    </StateCard>
  );
}
