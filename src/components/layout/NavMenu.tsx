'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  Drill,
  Briefcase,
  BookOpenText,
  Contact,
  FileUser,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';
import { useTranslations } from 'next-intl';
import { logout } from '@/app/actions/logout';

const createMenuItems = (locale: string) => [
  { href: `/${locale}`, icon: Home, isAnchor: false },
  { href: 'skills', icon: Drill, isAnchor: true },
  { href: `/${locale}/portfolio`, icon: Briefcase, isAnchor: false },
  { href: `/${locale}/blog`, icon: BookOpenText, isAnchor: false },
  { href: 'contacts', icon: Contact, isAnchor: true },
  { href: 'resume', icon: FileUser, isAnchor: false },
];

export default function ResponsiveNav({
  className,
  locale,
  resumeLink,
}: {
  className?: string;
  locale: string;
  resumeLink: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingScroll, setPendingScroll] = useState<string | null>(null);
  const menuItems = createMenuItems(locale);
  const t = useTranslations('header');
  const pathname = usePathname();
  const router = useRouter();
  const isHomePage = pathname === `/${locale}`;
  const isCms = pathname.includes('/cms');
  const isLogin = pathname.includes('/cms/login');
  const isRegister = pathname.includes('/cms/register');

  useEffect(() => {
    // Handle scrolling when we're on the home page and have a pending scroll target
    if (isHomePage && pendingScroll) {
      const element = document.getElementById(pendingScroll);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setPendingScroll(null); // Clear the pending scroll
      }
    }
  }, [isHomePage, pendingScroll]);

  const handleClick = async (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string,
    isAnchor: boolean
  ) => {
    if (!isAnchor) return;

    e.preventDefault();
    setIsOpen(false);

    if (isHomePage) {
      // If we're already on the home page, just scroll
      const element = document.getElementById(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // If we're on another page, navigate to home first and set pending scroll
      setPendingScroll(href);
      router.push(`/${locale}`);
    }
  };

  const getHref = (item: { href: string; isAnchor: boolean }) => {
    if (item.href === 'resume') return resumeLink;
    if (item.isAnchor) {
      // For anchor links, we'll handle the navigation in onClick
      // but we still need a valid href for the link
      return `/${locale}`;
    }
    return item.href;
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  return (
    <>
      {!isCms ? (
        <>
          {/* Desktop Navigation */}
          <nav className={`${className} hidden lg:flex text-xl`}>
            {menuItems.map((button, i) => {
              const hasUmamiTracking = button.href === 'resume';
              const href = getHref(button);

              return (
                <Link
                  key={String(button.icon)}
                  href={href}
                  className="mx-4 transition-all hover:text-main flex items-center"
                  onClick={(e) => handleClick(e, button.href, button.isAnchor)}
                  {...(hasUmamiTracking && {
                    'data-umami-event': 'Resume Button',
                  })}
                >
                  <button.icon className="mr-2 -mt-1" />
                  {t(`buttons.${i}`)}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Navigation */}
          <div className={`${className} lg:hidden`}>
            <div className="absolute top-4 right-4 z-30">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="scale-[85%] xs:scale-100"
                aria-label="Toggle menu"
              >
                {isOpen ? <X size={40} /> : <Menu size={40} />}
              </button>
            </div>

            <nav
              className={`fixed mt-2 backdrop-blur-[70px] shadow-lg z-10 -top-1.5 left-1/2 transform-gpu -translate-x-1/2 w-[100vw] h-[100vh] max-w-full max-h-full right-auto flex justify-center items-center transition-all duration-[400ms] ease-in-out ${
                isOpen
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 -translate-y-20 pointer-events-none'
              }`}
            >
              <ul
                className={`space-y-[4rem] p-4 scale-[85%] xs:scale-100 -mt-16 transition-all duration-[400ms] ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
              >
                {menuItems.map((item, i) => {
                  const hasUmamiTracking = item.href === 'resume';
                  const href = getHref(item);

                  return (
                    <li key={String(item.icon)}>
                      <Link
                        href={href}
                        className="flex text-3xl items-center space-x-2 text-darktext dark:text-lighttext transition-all duration-[400ms] ease-in-out"
                        onClick={(e) => {
                          handleClick(e, item.href, item.isAnchor);
                          setIsOpen(false);
                        }}
                        {...(hasUmamiTracking && {
                          'data-umami-event': 'Resume Clicked',
                        })}
                      >
                        <item.icon size={35} className="mr-2" />
                        <span>{t(`buttons.${i}`)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div
                className={`flex space-x-2 xs:space-x-5 sm:space-x-5 bottom-10 absolute left-1/2 transform-gpu -translate-x-1/2 scale-[85%] xs:scale-100 transition-all duration-[400ms] ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0'}`}
              >
                <LanguageToggle />
                <ThemeToggle />
              </div>
            </nav>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-3xl absolute left-1/2 -translate-x-1/2">{`CMS - ${isLogin ? 'login page' : isRegister ? 'register page' : 'edit mode'}`}</h1>

          <nav className="text-xl flex">
            <Link
              href={'/'}
              className="mx-4 transition-all hover:text-main flex items-center"
            >
              <Home className="mr-2 -mt-1" />
              Home
            </Link>
            {!isLogin && !isRegister && (
              <button
                type="button"
                onClick={() => logout()}
                className="mx-4 transition-all hover:text-main flex items-center"
              >
                <FileUser className="mr-2 -mt-1" />
                Logout
              </button>
            )}
            {isLogin && (
              <Link
                href={`/${locale}/cms/register`}
                className="mx-4 transition-all hover:text-main flex items-center"
              >
                <FileUser className="mr-2 -mt-1" />
                Registrati
              </Link>
            )}
            {isRegister && (
              <Link
                href={`/${locale}/cms/login`}
                className="mx-4 transition-all hover:text-main flex items-center"
              >
                <FileUser className="mr-2 -mt-1" />
                Accedi
              </Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}
