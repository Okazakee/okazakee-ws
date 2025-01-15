'use client'

import { useEffect, useState } from 'react'
import { Menu, X, Home, Drill, Briefcase, BookOpenText, Contact, FileUser } from 'lucide-react'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'
import { scrollToSection } from '@/utils/scrollToSection'
import { useTranslations } from 'next-intl'

// Function to create menu items with the current locale
const createMenuItems = (locale: string) => [
  { href: `/${locale}`, icon: Home },
  { href: `skills`, icon: Drill },
  { href: `/${locale}/portfolio`, icon: Briefcase },
  { href: `/${locale}/blog`, icon: BookOpenText },
  { href: `contacts`, icon: Contact },
  { href: 'resume', icon: FileUser },
]

export default function MobileNav({
  className,
  locale,
  resumeLink,
}: {
  className?: string
  locale: string
  resumeLink: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const menuItems = createMenuItems(locale)
  const t = useTranslations('header')

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden' // Disable scrolling
    } else {
      document.body.style.overflow = 'auto' // Enable scrolling
    }
    return () => {
      document.body.style.overflow = 'auto' // Ensure scroll is unlocked on unmount
    }
  }, [isOpen])

  return (
    <div className={`${className}`}>
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="scale-[85%] xs:scale-100"
          aria-label="Close menu"
        >
          {isOpen ? <X size={40} /> : <Menu size={40} />}
        </button>
      </div>
      <nav
        className={`fixed mt-2 backdrop-blur-[70px] shadow-lg z-10 -top-1.5 left-1/2 transform -translate-x-1/2 w-[100vw] h-[100vh] max-w-full max-h-full right-auto flex justify-center items-center transition-all duration-[400ms] ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <ul className="space-y-16 p-4 scale-[85%] xs:scale-100">
          {menuItems.map((item, i) => {
            const isScrollLink = !item.href.includes('/')
            if (item.href === 'resume') {
              return (
                <li key={item.href}>
                  <a
                    href={resumeLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex text-3xl items-center space-x-2 text-darktext dark:text-lighttext transition-all duration-[400ms] ease-in-out"
                    data-umami-event="Resume Clicked"
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon size={35} className="mr-2" />
                    <span>{t(`buttons.${i}`)}</span>
                  </a>
                </li>
              )
            }
            return (
              <li key={item.href}>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    if (isScrollLink) {
                      scrollToSection(item.href)
                    } else {
                      window.location.assign(item.href)
                    }
                  }}
                  className="flex text-3xl items-center space-x-2 text-darktext dark:text-lighttext transition-all duration-[400ms] ease-in-out"
                >
                  <item.icon size={35} className="mr-2" />
                  <span>{t(`buttons.${i}`)}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div className="flex space-x-5 bottom-10 absolute left-1/2 transform -translate-x-1/2 scale-[85%] xs:scale-100">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </nav>
    </div>
  )
}

export function DesktopNav({
  className,
  locale,
  resumeLink,
}: {
  className?: string
  locale: string
  resumeLink: string
}) {
  const menuItems = createMenuItems(locale)
  const t = useTranslations('header')

  return (
    <nav className={`${className} hidden lg:flex text-xl`}>
      {menuItems.map((button, i) => {
        const isScrollLink = !button.href.includes('/')
        if (button.href === 'resume') {
          return (
            <a
              key={button.href}
              href={resumeLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-4 transition-all hover:text-main flex items-center"
              data-umami-event="Resume Button"
            >
              <button.icon className="mr-2 -mt-1" />
              {t(`buttons.${i}`)}
            </a>
          )
        }
        return (
          <button
            key={button.href}
            onClick={() =>
              isScrollLink
                ? scrollToSection(button.href)
                : window.location.assign(button.href)
            }
            className="mx-4 transition-all hover:text-main flex items-center"
          >
            <button.icon className="mr-2 -mt-1" />
            {t(`buttons.${i}`)}
          </button>
        )
      })}
    </nav>
  )
}