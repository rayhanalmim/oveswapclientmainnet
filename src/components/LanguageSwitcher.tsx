'use client'

import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleScroll = () => setIsOpen(false)
    const handleResize = () => setIsOpen(false)

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ]

  const currentLanguage = languages.find(lang => lang.code === language)

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as 'en' | 'ja')
    setIsOpen(false)
  }

  const handleToggleDropdown = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setButtonRect(rect)
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={handleToggleDropdown}
        className="relative group overflow-hidden transition-all duration-300 px-3 lg:px-4 py-2 lg:py-2.5 rounded-lg lg:rounded-xl bg-gradient-to-r from-gray-500/10 via-gray-400/10 to-gray-500/10 border border-white/10 hover:border-white/20"
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-gray-500/20 via-gray-400/20 to-gray-500/20" />

        {/* Button content */}
        <div className="relative flex items-center gap-2">
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className="text-white/90 font-medium text-sm lg:text-base hidden sm:inline">
            {currentLanguage?.name}
          </span>
          {/* Dropdown arrow */}
          <svg 
            className={`w-3 h-3 text-white/60 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 group-hover:translate-x-full transition-all duration-1000 transform -skew-x-12 -translate-x-full" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && buttonRect && (
        <div 
          className="fixed w-40 bg-black/90 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-[9999] overflow-hidden animate-fade-in-up"
          style={{
            top: buttonRect.bottom + 8,
            right: window.innerWidth - buttonRect.right,
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-all duration-200 flex items-center gap-3 ${
                language === lang.code ? 'bg-white/10 text-white' : 'text-white/80'
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="font-medium">{lang.name}</span>
              {language === lang.code && (
                <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageSwitcher
