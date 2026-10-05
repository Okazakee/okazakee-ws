import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import CopyLinkButton from '../common/CopyButton';

// Identity the footer showed before the CMS could edit it; a null/blank stored
// value keeps these (module-level constants are camelCase per AGENTS.md §7).
const defaultName = 'Okazakee';
const defaultVatNumber = '02863310815';

export default async function Footer({
  locale,
  name,
  vatNumber,
}: {
  locale: string;
  /** Stored `site_settings.footer_name`; null keeps the default. */
  name?: string | null;
  /** Stored `site_settings.footer_vat_number`; null keeps the default. */
  vatNumber?: string | null;
}) {
  const t = await getTranslations({ locale, namespace: 'footer' });
  const tPosts = await getTranslations({ locale, namespace: 'posts-section' });

  // Standalone CMS origin (falls back to the legacy path, which the Proxy
  // redirects to the CMS host when LEGACY_CMS_REDIRECT_HOST is set).
  const cmsPublicUrl = process.env.NEXT_PUBLIC_CMS_URL ?? `/${locale}/cms`;

  const linkClass = 'transition-colors hover:text-accent-violet-light';

  const separator = '//';

  // Resolved once and used twice: the label and the clipboard value stay the
  // same string, so a stored VAT keeps its zeroes instead of diverging.
  const displayName = name?.trim() || defaultName;
  const vat = vatNumber?.trim() || defaultVatNumber;

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
            {displayName}
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
          <CopyLinkButton
            buttonTitle={t('buttonTitle')}
            className="transition-colors hover:text-text-muted"
            copiedLabel={tPosts('preCopy')}
            copyValue={vat}
          >
            {t('middle')} - {vat}
          </CopyLinkButton>
          <span>{separator}</span>
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
