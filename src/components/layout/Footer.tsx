import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import CopyLinkButton from '../common/CopyButton';

export default async function Footer({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tPosts = await getTranslations({ locale, namespace: 'posts-section' });

  // Standalone CMS origin (falls back to the legacy path, which the Proxy
  // redirects to the CMS host when LEGACY_CMS_REDIRECT_HOST is set).
  const cmsPublicUrl = process.env.NEXT_PUBLIC_CMS_URL ?? `/${locale}/cms`;

  const linkClass = 'transition-colors hover:text-accent-violet-light';

  return (
    <footer className="border-t border-border-subtle bg-surface-base py-8 font-mono text-xs text-text-dim">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
        <div>
          {t('left')}{' '}
          <Link className="text-text-muted transition-colors hover:text-accent-violet-light" href="https://github.com/Okazakee">
            Okazakee
          </Link>{' '}
          <span className="text-border-hover">|</span>{' '}
          <Link className={linkClass} href="https://github.com/Okazakee/okazakee-ws">
            {t('source')}
          </Link>
        </div>

        <CopyLinkButton
          buttonTitle={t('buttonTitle')}
          className="transition-colors hover:text-text-muted"
          copiedLabel={tPosts('preCopy')}
          copyValue="02863310815"
        >
          {t('middle')} - 02863310815
        </CopyLinkButton>

        <div className="flex items-center gap-4">
          <Link className={linkClass} href={cmsPublicUrl} prefetch={false}>
            CMS
          </Link>
          <span className="text-border-hover">•</span>
          <Link className={linkClass} href={`/${locale}/privacy-policy`}>
            {t('privacyPolicy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
