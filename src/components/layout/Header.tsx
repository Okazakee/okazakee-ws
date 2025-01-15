import React from "react";
import Image from "next/image";
import logo from "@public/logo.svg";
import Link from "next/link";
import MobileNav, { DesktopNav } from "./NavMenu";
import { getResumeLink } from "@/utils/getData";

export default async function Header( { locale } : { locale: string } ) {

  const resume = await getResumeLink();

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
            priority
            className="dark:invert -mt-0.5 xl:w-[200px] w-[130px] xs:w-[160px] transition-all duration-[400ms] ease-in-out"
            alt="logo"
          />
        </Link>

        <DesktopNav locale={locale} resumeLink={resume!} />

        <MobileNav locale={locale} resumeLink={resume!} className="ml-auto flex items-center md:hidden" />
      </div>
    </header>
  );
};