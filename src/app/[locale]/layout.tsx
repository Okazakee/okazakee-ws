import '../globals.css';
import { SpeedInsights } from '@vercel/speed-insights/next';
import localFont from 'next/font/local';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { Suspense } from 'react';
import { publicConfig } from '@/config/public';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ScrollTop from '@/components/layout/ScrollTop';
import { isValidLocale, locales } from '@/i18n/routing';
import type { ResumeData } from '@/types/fetchedData.types';
import {
  getResumeLink,
  getSiteSettings,
  getTranslationsSupabase,
} from '@/utils/getData';
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
  const messages = await getTranslationsSupabase(locale);

  const resumeData = (await getResumeLink()) as ResumeData;
  const resumeLink = resumeData
    ? resumeData[`resume_${locale}` as keyof ResumeData]
    : null;

  // Null while the CMS has never written the row: the header then renders
  // the bundled logos and the computed nav hrefs it always rendered.
  const settings = await getSiteSettings();

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <Header
        locale={locale}
        resumeLink={resumeLink}
        logoDark={settings?.header_logo_dark ?? null}
        logoLight={settings?.header_logo_light ?? null}
        navAnchors={settings?.nav_anchors ?? null}
      />
      <div className="flex min-w-0 flex-1 flex-col [&>*]:min-w-0 [&>*]:w-full">
        {children}
      </div>
      <ScrollTop />
      <Footer locale={locale} />
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
        {/* Blocking theme script — runs before paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('themeMode');var isDark=m==='dark'||(m!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',isDark);}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${whiteRabbit.variable} flex min-h-screen flex-col font-whiterabt antialiased transition-colors duration-400 ease-in-out scroll-smooth`}
      >
        <Providers>
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
