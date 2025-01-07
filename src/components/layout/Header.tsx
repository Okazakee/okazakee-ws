import React from "react";
import Image from "next/image";
import logo from "@public/logo.svg";
import Link from "next/link";
import { BookOpenText, BriefcaseBusiness, Contact, Drill, Home } from "lucide-react";
import HamburgerMenu from "../common/HamburgerMenu";

const Header = () => {

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
            className="dark:invert -mt-0.5 xl:w-[200px] w-[150px] transition-all duration-300"
            alt="logo"
          />
        </Link>

        <div className="hidden lg:flex text-xl">
          <Link href={"/#about"} className="px-4 transition-all hover:text-main flex items-center">
            <Home className="mr-2 -mt-1" />
            Home
          </Link>
          <Link href={"/#skills"} className="px-4 transition-all hover:text-main flex items-center">
            <Drill className="mr-2 -mt-1" />
            Skills
          </Link>
          <Link href={"/portfolio"} className="px-4 transition-all hover:text-main flex items-center">
            <BriefcaseBusiness className="mr-2 -mt-1" />
            Portfolio
          </Link>
          <Link href={"/blog"} className="px-4 transition-all hover:text-main flex items-center">
            <BookOpenText className="mr-2 -mt-1" />
            Blog
          </Link>
          <Link href={"/#contacts"} className="px-4 transition-all hover:text-main flex items-center">
            <Contact className="mr-2 -mt-1" />
            Contacts
          </Link>
        </div>

        <div className="ml-auto flex items-center md:hidden">
          <HamburgerMenu className="" />
        </div>
      </div>
    </header>
  );
};

export default Header;