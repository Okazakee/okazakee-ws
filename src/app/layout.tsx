import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import Header from "../components/Header";
import Footer from "../components/Footer";

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
    <html lang="en" className="">
      <body className={`${whiteRabbit.variable} font-whiterabt antialiased`}>
        <div id="about" className="rounded-xl my-4 mx-3 xl:m-5 scroll-smooth">
          <Header />
            <Providers>
              {children}
            </Providers>
          <Footer />
        </div>
      </body>
    </html>
  );
}
