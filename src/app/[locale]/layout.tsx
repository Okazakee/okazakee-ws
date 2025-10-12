import localFont from 'next/font/local';
import '../globals.css';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ScrollTop from '@/components/layout/ScrollTop';
import { getTranslationsSupabase } from '@/utils/getData';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { NextIntlClientProvider } from 'next-intl';
import Script from 'next/script';
import { Providers } from '../providers';
import { cookies } from 'next/headers';

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
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  const messages = await getTranslationsSupabase(locale);
  
  // Read theme preference from cookies during SSR
  const cookieStore = await cookies();
  const themeMode = cookieStore.get('themeMode')?.value || 'auto';
  const resolvedTheme = cookieStore.get('resolvedTheme')?.value;
  
  // Determine if dark mode should be applied
  // Use resolvedTheme if available (for auto mode), otherwise use themeMode
  let isDark = false;
  
  if (resolvedTheme) {
    // Use the resolved theme (handles auto mode correctly)
    isDark = resolvedTheme === 'dark';
  } else {
    // Fallback to themeMode for explicit light/dark
    isDark = themeMode === 'dark';
  }

  return (
    <html lang={locale} className={isDark ? 'dark' : ''} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={isDark ? '#0a0a0a' : '#d4d4d4'} />
        <meta name="darkreader-lock" />
        <meta name="color-scheme" content={isDark ? 'dark' : 'light'} />
        <link rel="preconnect" href="https://mtvwynyikouqzmhqespl.supabase.co" />
        <link rel="dns-prefetch" href="https://mtvwynyikouqzmhqespl.supabase.co" />
        <link rel="preconnect" href="https://umami.okazakee.dev" />
      </head>
      <Providers>
        <body
          id="about"
          className={`${whiteRabbit.variable} transition-colors duration-400 ease-in-out font-whiterabt antialiased rounded-xl scroll-smooth relative min-h-screen`}
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
          strategy="lazyOnload"
        />
      )}
    </html>
  );
}
