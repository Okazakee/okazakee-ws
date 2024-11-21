import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import Header from "../components/sections/Header";
import Footer from "../components/sections/Footer";

const whiteRabbit = localFont({
  src: "./fonts/WHITRABT.woff",
  variable: "--font-whiterabt",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Okazakee WS",
  description: "Personal website with portfolio and blog",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full">
      <body className={`${whiteRabbit.variable} font-whiterabt antialiased`}>
        <div id="about" className="rounded-xl scroll-smooth w-full">
          <Providers>
            <Header />
              {children}
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
