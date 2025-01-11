import localFont from "next/font/local";
import "../globals.css";
import { Providers } from "../providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { NextIntlClientProvider } from 'next-intl';
import { getTranslations } from '@/utils/getData';

const whiteRabbit = localFont({
  src: "../fonts/whiterabbit.woff",
  variable: "--font-whiterabt",
  weight: "400",
});

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {

  const { locale } = await params;

  const messages = await getTranslations(locale);

  console.log(JSON.stringify(messages), 'adaasdasas')

  return (
    <html lang={ locale }>
      <Providers>
        <body id="about" className={`${whiteRabbit.variable} transition-colors duration-[400ms] ease-in-out font-whiterabt antialiased rounded-xl scroll-smooth w-full relative`}>
          <NextIntlClientProvider messages={messages} locale={locale}>
            <Header />
              {children}
            <Footer />
          </NextIntlClientProvider>
        </body>
      </Providers>
    </html>
  );
}
