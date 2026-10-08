import '../globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { Suspense } from 'react';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import { LocaleScrollRestore } from '@/components/layout/LocaleScrollRestore';
import ScrollTop from '@/components/layout/ScrollTop';
import { publicConfig } from '@/config/public';
import { isValidLocale, locales } from '@/i18n/routing';
import type { ResumeData } from '@/types/fetchedData.types';
import { getResumeLink, getSiteSettings } from '@/utils/getData';
import { Providers } from '../providers';

const umamiEnabled = process.env.UMAMI_ENABLED === 'true';

const whiteRabbit = localFont({
  src: '../public/fonts/whiterabbit.woff2',
  variable: '--font-whiterabt',
  weight: '400',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

async function LocaleShell({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: React.ReactNode;
}) {
  const { locale } = await params;

  const resumeData = (await getResumeLink()) as ResumeData;
  const resumeLink = resumeData
    ? resumeData[`resume_${locale}` as keyof ResumeData]
    : null;

  // Header images and VAT are CMS-owned; footer identity stays local.
  const settings = await getSiteSettings();

  return (
    <NextIntlClientProvider locale={locale}>
      <LocaleScrollRestore />
      <Header
        locale={locale}
        logoDarkUrl={settings?.header_logo_dark ?? null}
        logoLightUrl={settings?.header_logo_light ?? null}
        resumeLink={resumeLink}
      />
      <div className="flex min-w-0 flex-1 flex-col [&>*]:min-w-0 [&>*]:w-full">
        {children}
      </div>
      <ScrollTop />
      <Footer locale={locale} vatNumber={settings?.footer_vat_number ?? null} />
    </NextIntlClientProvider>
  );
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const supabasePreconnect = publicConfig.supabaseHostname;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <html lang={locale} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#0a0a0a" />
        <meta name="darkreader-lock" />
        <meta name="color-scheme" content="dark light" />
        {supabasePreconnect && (
          <>
            <link rel="preconnect" href={`https://${supabasePreconnect}`} />
            <link rel="dns-prefetch" href={`https://${supabasePreconnect}`} />
          </>
        )}
        <link rel="preconnect" href="https://umami.okazakee.dev" />
      </head>
      <body
        className={`${whiteRabbit.variable} flex min-h-screen flex-col font-whiterabt antialiased scroll-smooth`}
      >
        <Providers locale={locale}>
          <Suspense>
            <LocaleShell params={params}>{children}</LocaleShell>
          </Suspense>
          {/* Vercel-only analytics endpoint: skip it off-platform so local dev
              does not request a script that only exists on Vercel. */}
          {process.env.VERCEL && <SpeedInsights />}
          {umamiEnabled && (
            <Script
              src="https://umami.okazakee.dev/script.js"
              data-website-id="3eba2ffb-eb82-49ab-a7b5-272a0d9a988c"
              strategy="lazyOnload"
            />
          )}
        </Providers>
      </body>
    </html>
  );
}
