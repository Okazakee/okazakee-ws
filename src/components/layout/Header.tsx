import React from "react";
import Image from "next/image";
import logo from "@public/logo.svg";
import Link from "next/link";
import MobileNav, { DesktopNav } from "./NavMenu";

const Header = () => {

  return (
    <header className="max-w-screen-2xl mx-auto pt-2">
      <div className="flex justify-center items-center pt-5 mx-5">
        <Link
          href={"/"}
          className="xl:mr-auto xl:mx-0 xl:static"
        >
          <Image
            placeholder="blur"
            src={logo}
            width={200}
            height={100}
            className="dark:invert -mt-0.5 xl:w-[200px] w-[150px] transition-all duration-300"
            alt="logo"
          />
        </Link>

        <DesktopNav />

        <div className="ml-auto flex items-center md:hidden">
          <MobileNav />
        </div>
      </div>
    </header>
  );
};

export default Header;