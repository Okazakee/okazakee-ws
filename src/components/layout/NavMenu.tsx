'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Drill, Briefcase, BookOpenText, Contact } from 'lucide-react'
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
  const [isOpen, setIsOpen] = useState(false)

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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-lighttext relative w-10 h-10 z-20"
        aria-expanded={isOpen}
      >
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out">
          <Menu
            className={`w-10 h-10 p-1 rounded-md bg-secondary transition-all duration-300 ${
              isOpen ? 'opacity-0' : 'opacity-100'
            }`}
            aria-hidden="true"
          />
        </div>
      </button>
      <nav
        className={`fixed mt-2 backdrop-blur-3xl rounded-lg shadow-lg z-10 top-0 left-1/2 transform -translate-x-1/2 w-[100vw] h-[100svh] max-w-full max-h-full right-auto flex justify-center items-center transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="absolute top-4 right-4 z-30">
          <button
            onClick={() => setIsOpen(false)}
            className="text-white"
            aria-label="Close menu"
          >
            <X size={50} className="text-darktext dark:text-lighttext" />
          </button>
        </div>
        <ul className="space-y-16 p-4">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex text-3xl items-center space-x-2 transition-colors duration-200"
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