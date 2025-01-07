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

export default function MobileNav({ className } : { className?: string }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-white hover:bg-gray-700 focus:outline-none"
        aria-expanded={isOpen}
      >
        {isOpen ? (
          <X className="w-10 h-10 p-1 rounded-md bg-main" aria-hidden="true" />
        ) : (
          <Menu className="w-10 h-10 p-1 rounded-md bg-main" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <nav className="mt-2 p-4 bg-gray-800 rounded-lg shadow-lg">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center space-x-2 text-white hover:text-gray-300 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}

export function DesktopNav({ className } : { className?: string }) {
  return (
    <div className={`${className} hidden lg:flex text-xl`}>
      {menuItems.map((button) => (
        <Link key={button.label} href={button.href} className="px-4 transition-all hover:text-main flex items-center">
          <button.icon className="mr-2 -mt-1" />
          {button.label}
        </Link>
      ))}
    </div>
  )
}