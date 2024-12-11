"use client";

import React from "react";
import Image from "next/image";
import ThemeToggle from "@components/ThemeToggle";
import logo from "@public/logo.svg";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, BriefcaseBusiness, Contact, Drill, House } from "lucide-react";

const Header = () => {
  const pathname = usePathname();

  return (
    <div className="-mb-[66px] max-w-screen-2xl mx-auto">
      <div className="flex justify-center items-center pt-5 mx-5">
        <Link
          href={"/"}
          className="xl:mr-auto xl:mx-0 absolute xl:static left-1/2 transform -translate-x-1/2 space-x-5 xl:left-0 xl:-translate-x-0 xl:space-x-0"
        >
          <Image
            src={logo}
            width={200}
            height={100}
            className="dark:invert -mt-0.5 xl:w-[200px] w-[150px] transition-all duration-300"
            alt="logo"
          />
        </Link>

        {pathname === "/" ? (
          <div className="hidden lg:flex text-2xl absolute left-1/2 transform -translate-x-1/2 space-x-5">
            <Link href={"#skills"} className="px-3 transition-all hover:text-main flex items-center">
              <Drill className="mr-2 -mt-1" />
              Skills
            </Link>
            <Link href={"/portfolio"} className="px-3 transition-all hover:text-main flex items-center">
              <BriefcaseBusiness className="mr-2 -mt-1" />
              Portfolio
            </Link>
            <Link href={"/blog"} className="px-3 transition-all hover:text-main flex items-center">
              <BookOpenText className="mr-2 -mt-1" />
              Blog
            </Link>
            <Link href={"#contacts"} className="px-3 transition-all hover:text-main flex items-center">
              <Contact className="mr-2 -mt-1" />
              Contacts
            </Link>
          </div>
        ) : (
          <Link href={"/"} className="text-2xl absolute left-1/2 transform -translate-x-1/2 hover:text-main flex items-center">
            <House className="mr-2 -mt-1" />
            Go to Homepage
          </Link>
        )}

        <div className="ml-auto flex items-center">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default Header;