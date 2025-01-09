'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, Home, Drill, Briefcase, BookOpenText, Contact } from 'lucide-react'

const menuItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/#skills', label: 'Skills', icon: Drill },
  { href: '/portfolio', label: 'Portfolio', icon: Briefcase },
  { href: '/blog', label: 'Blog', icon: BookOpenText },
  { href: '/#contacts', label: 'Contacts', icon: Contact },
];

export default function MobileNav({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-lighttext relative w-10 h-10"
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
        <div className="absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out">
          <X
            className={`w-10 h-10 p-1 rounded-md bg-secondary transition-all duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-0'
            }`}
            aria-hidden="true"
          />
        </div>
      </button>
      <nav
        className={`
          mt-2 p-4 backdrop-blur-3xl rounded-lg shadow-lg absolute z-10 right-0 w-[12rem] flex justify-center
          transition-all duration-300 ease-in-out
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
        `}
      >
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex text-xl items-center space-x-2 text-white hover:text-gray-300 transition-colors duration-200"
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
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