'use client'
import { useState, useEffect } from 'react'

type Language = 'IT' | 'EN'

export default function LanguageSelector() {
  const [language, setLanguage] = useState<Language>('IT')

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage) {
      setLanguage(savedLanguage)
    }
  }, [])

  const changeLanguage = (newLanguage: Language) => {
    setLanguage(newLanguage)
    localStorage.setItem('language', newLanguage)
  }

  const langs = ['IT', 'EN']

  return (
    <div className="flex rounded-md overflow-hidden">
    {langs.map((lang, i) => {
      return (
        <div key={i} className='flex items-center'>
          <button
            className={`text-xl mx-1 font-medium ${
              language === lang ? 'text-main' : 'text-darktext dark:text-lighttext transition-all duration-300 hover:text-main'}`}
            onClick={() => changeLanguage(lang as Language)}
            aria-pressed={language === lang as Language}
          >
            {lang}
          </button>
        </div>
      )
    })}
    </div>
  )
}

