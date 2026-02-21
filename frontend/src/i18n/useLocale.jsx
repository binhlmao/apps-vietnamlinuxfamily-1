import { createContext, useContext, useState, useCallback } from 'react'
import vi from './vi'
import en from './en'

const locales = { vi, en }
const LocaleContext = createContext()

export function LocaleProvider({ children }) {
  const [locale, setLocaleState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('vnlf-locale') || 'vi'
    }
    return 'vi'
  })

  const setLocale = useCallback((newLocale) => {
    setLocaleState(newLocale)
    localStorage.setItem('vnlf-locale', newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback((key, ...args) => {
    // Support: t('category', item.name_vi, item.name_en) -> pick by locale
    if (args.length === 2) {
      return locale === 'vi' ? args[0] : args[1]
    }
    const str = locales[locale]?.[key] || locales.vi[key] || key
    // Support: t('reviewCount', { count: 5 }) -> "5 đánh giá"
    if (args.length === 1 && typeof args[0] === 'object') {
      return Object.entries(args[0]).reduce(
        (s, [k, v]) => s.replace(`{${k}}`, v),
        str
      )
    }
    return str
  }, [locale])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be inside LocaleProvider')
  return ctx
}
