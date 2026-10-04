import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { InnerHtml } from '@/components/common/InnerHtml';
import MarkdownRenderer from '@/components/layout/MarkdownRenderer';
import { getPrivacyPolicy } from '@/utils/getData';
import { SITE_NAME, SITE_OG_IMAGE } from '@/utils/structuredData';

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'it' }];
}

const titles: Record<string, string> = {
  en: 'Privacy Policy',
  it: 'Informativa sulla Privacy',
};

const descriptions: Record<string, string> = {
  en: 'Privacy Policy for the Okazakee website',
  it: 'Informativa sulla privacy per il sito Okazakee',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const normalizedLocale = locale === 'it' ? 'it' : 'en';
  const baseUrl = process.env.DOMAIN_URL;
  const title = titles[locale] ?? titles.en;
  const description = descriptions[locale] ?? descriptions.en;

  return {
    title: `${title} | Okazakee`,
    description,
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${title} | Okazakee`,
      description,
      images: [SITE_OG_IMAGE],
    },
    alternates: {
      canonical: `${baseUrl}/${normalizedLocale}/privacy-policy`,
      languages: {
        en: `${baseUrl}/en/privacy-policy`,
        it: `${baseUrl}/it/privacy-policy`,
        'x-default': `${baseUrl}/en/privacy-policy`,
      },
    },
  };
}

export default async function PrivacyPolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const privacyPolicy = await getPrivacyPolicy(locale);

  if (!privacyPolicy) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: 'privacyPolicy' });

  // The document ends with a "Last updated" line under a rule; the design wants
  // it as a meta line under the title instead (docs/DESIGN.md §6).
  // Locale-agnostic: the last rule in the document is followed by an italic
  // line ("Last updated: ..." / "Ultimo aggiornamento: ...").
  const lastUpdatedMatch = privacyPolicy.match(/-{3,}\s*\*([^*]+)\*\s*$/);
  const lastUpdated = lastUpdatedMatch ? lastUpdatedMatch[1].trim() : null;
  const body = lastUpdatedMatch
    ? privacyPolicy.slice(0, lastUpdatedMatch.index).trim()
    : privacyPolicy;

  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="mb-14 text-center">
        <InnerHtml
          as="h1"
          className="font-heading text-2xl font-semibold text-text-white sm:text-3xl"
          html={titles[locale] ?? titles.en}
        />
        <p className="mt-2 font-mono text-xs text-accent-violet-light sm:text-sm">
          {t('description')}
        </p>
        <div className="mx-auto mt-3 h-0.5 w-10 rounded-full bg-accent-violet" />
        {lastUpdated && (
          <p className="mt-5 font-mono text-[11px] tracking-[0.08em] text-text-dim uppercase">
            {lastUpdated}
          </p>
        )}
      </div>

      <div className="legal post mx-auto max-w-3xl">
        <MarkdownRenderer markdown={body} />
      </div>
    </section>
  );
}
