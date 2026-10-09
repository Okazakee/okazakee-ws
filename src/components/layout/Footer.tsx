import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import CopyLinkButton from '../common/CopyButton';

const siteName = 'Okazakee';

export default async function Footer({
  locale,
  vatNumber,
}: {
  locale: string;
  /** Stored `site_settings.footer_vat_number`; null/blank renders no VAT. */
  vatNumber?: string | null;
}) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tPosts = await getTranslations({ locale, namespace: 'posts-section' });

  // Standalone CMS origin (falls back to the legacy path, which the Proxy
  // redirects to the CMS host when LEGACY_CMS_REDIRECT_HOST is set).
  const cmsPublicUrl = process.env.NEXT_PUBLIC_CMS_URL ?? `/${locale}/cms`;

  const linkClass = 'transition-colors hover:text-accent-violet-light';

  const separator = '//';

  // The CMS owns the value: it is printed and copied verbatim, and an unset
  // one renders no VAT affordance at all rather than a local substitute.
  const vat = vatNumber?.trim() || null;

  return (
    <footer className="border-t border-border-subtle bg-surface-alt py-8 font-mono text-xs text-text-dim sm:py-0">
      {/* Desktop band mirrors the header's h-16 (same 4rem + 1px hairline);
          below sm the footer keeps its original py-8 rhythm. */}
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 sm:min-h-16 sm:flex-row">
        <div>
          {t('left')}{' '}
          <Link
            className="text-text-muted transition-colors hover:text-accent-violet-light"
            href="https://github.com/Okazakee"
            rel="noopener noreferrer"
            target="_blank"
          >
            {siteName}
          </Link>{' '}
          <span>{separator}</span>{' '}
          <Link
            className={linkClass}
            href="https://github.com/Okazakee/okazakee-ws"
            rel="noopener noreferrer"
            target="_blank"
          >
            {t('source')}
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {vat && (
            <>
              <CopyLinkButton
                buttonTitle={t('buttonTitle')}
                className="transition-colors hover:text-text-muted"
                copiedLabel={tPosts('preCopy')}
                copyValue={vat}
              >
                {t('middle')} - {vat}
              </CopyLinkButton>
              <span>{separator}</span>
            </>
          )}
          <Link
            className="underline transition-colors hover:text-text-muted"
            href={cmsPublicUrl}
            prefetch={false}
            rel="noopener noreferrer"
            target="_blank"
          >
            CMS
          </Link>
          <span>{separator}</span>
          <Link
            className="underline transition-colors hover:text-text-muted"
            href={`/${locale}/privacy-policy`}
          >
            {t('privacyPolicy')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
