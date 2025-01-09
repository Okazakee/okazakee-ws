import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

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
    <html lang="en">
      <Providers>
        <body id="about" className={`${whiteRabbit.variable} transition-colors duration-[400ms] ease-in-out font-whiterabt antialiased rounded-xl scroll-smooth w-full relative`}>
          <Header />
            {children}
          <Footer />
        </body>
      </Providers>
    </html>
  );
}
