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
    description: 'Sidebar navy · Contenido blanco · Recomendado',
    colors: { bg: '#F4F7F5', surface: '#FFFFFF', primary: '#1A5C1A', accent: '#E8920A' },
    preview: { sidebar: '#0B1829', primary: '#1A5C1A', accent: '#E8920A', bg: '#F4F7F5' },
  },
  {
    id: 'verde',
    name: 'AgroSafe Green',
    description: 'Sidebar verde oscuro · Contenido claro',
    colors: { bg: '#EFF7F2', surface: '#FFFFFF', primary: '#1A5C1A', accent: '#E8920A' },
    preview: { sidebar: '#071A0C', primary: '#1A5C1A', accent: '#E8920A', bg: '#EFF7F2' },
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
