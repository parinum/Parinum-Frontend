import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'

type ThemeChoice = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

type ThemeContextValue = {
  theme: ThemeChoice
  resolvedTheme: ResolvedTheme
  setTheme: (value: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'parinum-theme'

const getStoredTheme = (): ThemeChoice | null => {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light' || stored === 'system') return stored
  return null
}

const getSystemTheme = (): ResolvedTheme => {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeChoice>(() => getStoredTheme() ?? 'system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => (typeof window === 'undefined' ? 'dark' : getSystemTheme()))
  const mediaQueryRef = useRef<MediaQueryList | null>(null)

  // Sync theme to DOM + storage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQueryRef.current = media

    const computeResolved = (choice: ThemeChoice): ResolvedTheme =>
      choice === 'system' ? (media.matches ? 'dark' : 'light') : choice

    const apply = (choice: ThemeChoice) => {
      const next = computeResolved(choice)
      setResolvedTheme(next)
      document.documentElement.dataset.theme = next
      document.body.dataset.theme = next
      document.documentElement.style.colorScheme = next

      if (choice === 'system') {
        window.localStorage.removeItem(STORAGE_KEY)
      } else {
        window.localStorage.setItem(STORAGE_KEY, choice)
      }
    }

    apply(theme)

    const handleChange = () => {
      if (theme === 'system') {
        apply('system')
      }
    }

    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
