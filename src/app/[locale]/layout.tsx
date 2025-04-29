import localFont from 'next/font/local';
import '../globals.css';
import { Providers } from '../providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { NextIntlClientProvider } from 'next-intl';
import { getTranslationsSupabase } from '@/utils/getData';
import Script from 'next/script';
import ScrollTop from '@/components/layout/ScrollTop';
import { SpeedInsights } from '@vercel/speed-insights/next';

const whiteRabbit = localFont({
  src: '../public/fonts/whiterabbit.woff2',
  variable: '--font-whiterabt',
  weight: '400',
});

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = await params;

  const messages = await getTranslationsSupabase(locale);

  return (
    <html lang={locale}>
      <Providers>
        <body
          id="about"
          className={`${whiteRabbit.variable} transition-colors duration-[400ms] ease-in-out font-whiterabt antialiased rounded-xl scroll-smooth relative min-h-screen`}
        >
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Header locale={locale} />
            {children}
            <ScrollTop />
            <Footer />
          </NextIntlClientProvider>
          <SpeedInsights />
        </body>
      </Providers>
      {process.env.UMAMI_ENABLED && (
        <Script
          src="https://umami.okazakee.dev/script.js"
          data-website-id="3eba2ffb-eb82-49ab-a7b5-272a0d9a988c"
          strategy="afterInteractive"
        />
      )}
    </html>
  );
}