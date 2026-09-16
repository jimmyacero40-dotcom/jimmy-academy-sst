'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type ThemeId = 'light' | 'verde'

export interface ThemeMeta {
  id: ThemeId
  name: string
  description: string
  colors: { bg: string; surface: string; primary: string; accent: string }
  preview: { sidebar: string; primary: string; accent: string; bg: string }
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'light',
    name: 'AgroSafe Navy',
    description: 'Sidebar #0B1736 · Acento cian · Recomendado',
    colors: { bg: '#F7F9FC', surface: '#FFFFFF', primary: '#06B6D4', accent: '#F59E0B' },
    preview: { sidebar: '#0B1736', primary: '#06B6D4', accent: '#F59E0B', bg: '#F7F9FC' },
  },
  {
    id: 'verde',
    name: 'AgroSafe Green',
    description: 'Sidebar #234B27 · Acento oliva · Naranja activo',
    colors: { bg: '#F7F9FC', surface: '#FFFFFF', primary: '#6BA644', accent: '#C97C30' },
    preview: { sidebar: '#234B27', primary: '#6BA644', accent: '#C97C30', bg: '#F7F9FC' },
  },
]

interface ThemeCtx {
  theme: ThemeId
  setTheme: (id: ThemeId, persist?: boolean) => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'light', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('light')

  useEffect(() => {
    const saved = localStorage.getItem('sst-theme') as ThemeId | null
    const valid: ThemeId[] = ['light', 'verde']
    const resolved = saved && valid.includes(saved) ? saved : 'light'
    setThemeState(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
  }, [])

  const setTheme = useCallback((id: ThemeId, persist = true) => {
    const html = document.documentElement
    html.classList.add('theme-switching')
    html.setAttribute('data-theme', id)
    setThemeState(id)
    if (persist) localStorage.setItem('sst-theme', id)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        html.classList.remove('theme-switching')
      })
    })
  }, [])

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
