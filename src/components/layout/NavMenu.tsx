'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Drill, Briefcase, BookOpenText, Contact, SquareMenu } from 'lucide-react'
import ThemeToggle from './ThemeToggle';
import LanguageToggle from './LanguageToggle';

const menuItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/#skills', label: 'Skills', icon: Drill },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/blog', label: 'Blog', icon: BookOpenText },
  { href: '/#contacts', label: 'Contacts', icon: Contact },
];

export default function MobileNav({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'; // Disable scrolling
    } else {
      document.body.style.overflow = 'auto'; // Enable scrolling
    }
    return () => {
      document.body.style.overflow = 'auto'; // Ensure scroll is unlocked on unmount
    };
  }, [isOpen]);

  return (
    <div className={`${className}`}>
      <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className=""
            aria-label="Close menu"
          >
            {isOpen ? <X size={40} className="" /> : <Menu size={40} className="" />}
          </button>
        </div>
      <nav
        className={`fixed mt-2 backdrop-blur-[70px] shadow-lg z-10 -top-1.5 left-1/2 transform -translate-x-1/2 w-[100vw] h-[100svh] max-w-full max-h-full right-auto flex justify-center items-center transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <ul className="space-y-16 p-4">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex text-3xl items-center space-x-2"
                onClick={() => setIsOpen(false)}
              >
                <item.icon size={35} className="mr-2" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          <ThemeToggle />
          <LanguageToggle />
        </ul>
      </nav>
    </div>
  )
}

export function DesktopNav({ className } : { className?: string }) {
  return (
    <nav className={`${className} hidden lg:flex text-xl`}>
      {menuItems.map((button) => (
        <Link key={button.label} href={button.href} className="px-4 transition-all hover:text-main flex items-center">
          <button.icon className="mr-2 -mt-1" />
          {button.label}
        </Link>
      ))}
    </nav>
  )
}