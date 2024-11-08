import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";

export const whiteRabbit = localFont({
  src: "./fonts/WHITRABT.woff", // path to your White Rabbit font file
  variable: "--font-whiterabt", // Custom CSS variable
  weight: "400", // Adjust based on the actual font weights
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
        <ThemeProvider>
          <div className="rounded-xl my-4 mx-3 md:m-5">
            <Header />
              {children}
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
