import React from "react";
import Image from "next/image";
import logo from "@public/logo.svg";
import Link from "next/link";
import MobileNav, { DesktopNav } from "./NavMenu";

export default function Header( { locale } : { locale: string } ) {

  return (
    <header className="max-w-screen-2xl mx-auto pt-2">
      <div className="flex justify-center items-center pt-5 mx-5">
        <Link
          href={"/"}
          className="xl:mr-auto xl:mx-0 xl:static"
        >
          <Image
            src={logo}
            width={200}
            height={100}
            className="dark:invert -mt-0.5 xl:w-[200px] w-[130px] xs:w-[160px] transition-all duration-[400ms] ease-in-out"
            alt="logo"
          />
        </Link>

        <DesktopNav locale={locale} />

        <MobileNav locale={locale} className="ml-auto flex items-center md:hidden" />
      </div>
    </header>
  );
};