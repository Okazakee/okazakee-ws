import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@components/sections/Header";
import Footer from "@components/sections/Footer";

const whiteRabbit = localFont({
  src: "./fonts/whiterabbit.woff",
  variable: "--font-whiterabt",
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full">
      <Providers>
        <body className={`${whiteRabbit.variable} font-whiterabt antialiased`}>
          <div id="about" className="rounded-xl scroll-smooth w-full relative">
              <Header />
                {children}
              <Footer />
          </div>
        </body>
      </Providers>
    </html>
  );
}
