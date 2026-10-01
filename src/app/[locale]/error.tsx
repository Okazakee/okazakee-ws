'use client';

import { Home, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StateCard } from '@/components/common/StateCard';

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');

  return (
    <StateCard
      code="500"
      label="error.log"
      text={t('errorText')}
      title={t('errorTitle')}
    >
      <button
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent-violet px-5 py-2.5 font-mono text-xs tracking-[0.08em] text-surface-base uppercase transition-colors hover:bg-accent-violet-light"
        onClick={reset}
        type="button"
      >
        <RefreshCw className="h-4 w-4" />
        {t('retry')}
      </button>
      <Link
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border-subtle bg-surface-raised px-5 py-2.5 font-mono text-xs tracking-[0.08em] text-text-main uppercase transition-colors hover:border-accent-violet/50 hover:text-text-white"
        href="/"
      >
        <Home className="h-4 w-4" />
        {t('home')}
      </Link>
    </StateCard>
  );
}
