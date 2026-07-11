'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

export type ThemeId = 'dark' | 'light' | 'navy' | 'verde' | 'academy'

export interface ThemeMeta {
  id: ThemeId
  name: string
  description: string
  colors: { bg: string; surface: string; primary: string; accent: string }
  preview: { sidebar: string; primary: string; accent: string; bg: string }
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'dark',
    name: 'Dark',
    description: 'Azul profundo · Modo oscuro',
    colors: { bg: '#060E1E', surface: '#0A1628', primary: '#3B82F6', accent: '#10B981' },
    preview: { sidebar: '#0A1628', primary: '#3B82F6', accent: '#10B981', bg: '#060E1E' },
  },
  {
    id: 'light',
    name: 'Light',
    description: 'Azul limpio · Modo claro',
    colors: { bg: '#F0F4FF', surface: '#FFFFFF', primary: '#2563EB', accent: '#059669' },
    preview: { sidebar: '#FFFFFF', primary: '#2563EB', accent: '#059669', bg: '#F0F4FF' },
  },
  {
    id: 'navy',
    name: 'Navy',
    description: 'SaaS Premium · Índigo / Cian',
    colors: { bg: '#07090F', surface: '#0D1117', primary: '#818CF8', accent: '#22D3EE' },
    preview: { sidebar: '#0D1117', primary: '#818CF8', accent: '#22D3EE', bg: '#07090F' },
  },
  {
    id: 'verde',
    name: 'Verde Agro',
    description: 'Agro & Campo · Esmeralda / Ámbar',
    colors: { bg: '#051208', surface: '#0A1C0F', primary: '#10B981', accent: '#F59E0B' },
    preview: { sidebar: '#0A1C0F', primary: '#10B981', accent: '#F59E0B', bg: '#051208' },
  },
  {
    id: 'academy',
    name: 'Academy',
    description: 'Educativo · Violeta / Rosa',
    colors: { bg: '#0C0814', surface: '#130D20', primary: '#A78BFA', accent: '#F472B6' },
    preview: { sidebar: '#130D20', primary: '#A78BFA', accent: '#F472B6', bg: '#0C0814' },
  },
]

interface ThemeCtx {
  theme: ThemeId
  setTheme: (id: ThemeId, persist?: boolean) => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', setTheme: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>('dark')

  useEffect(() => {
    const saved = (localStorage.getItem('sst-theme') as ThemeId) || 'dark'
    setThemeState(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  const setTheme = useCallback((id: ThemeId, persist = true) => {
    const html = document.documentElement

    // 1. Suppress ALL CSS transitions so the switch is truly instant.
    //    The universal * transition in globals.css makes color changes animate
    //    over 200ms — dramatic theme changes (dark→verde) look "slow".
    //    We freeze transitions for exactly one frame, then restore them.
    html.classList.add('theme-switching')

    // 2. Apply the new theme immediately — CSS variables update synchronously.
    html.setAttribute('data-theme', id)
    setThemeState(id)
    if (persist) localStorage.setItem('sst-theme', id)

    // 3. Restore transitions on the next painted frame.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        html.classList.remove('theme-switching')
      })
    })
  }, [])

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export const useTheme = () => useContext(Ctx)
