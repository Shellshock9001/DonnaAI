'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { Theme, ThemeConfig } from './types'
import { themes } from './themes'

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  config: ThemeConfig
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

interface Props {
  children: React.ReactNode
  defaultTheme?: Theme
}

export default function ThemeProvider({ children, defaultTheme = 'calm-bento' }: Props): JSX.Element {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored && themes[stored]) {
      setThemeState(stored)
    }
  }, [])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }, [])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const config = themes[theme] || themes['calm-bento']

  return (
    <ThemeContext.Provider value={{ theme, setTheme, config }}>
      {children}
    </ThemeContext.Provider>
  )
}

function applyTheme(theme: Theme): void {
  const config = themes[theme]
  if (!config) return

  const root = document.documentElement
  const tokens = config.tokens

  root.style.setProperty('--bg-page', tokens.bg.page)
  root.style.setProperty('--bg-surface-low', tokens.bg.surfaceLow)
  root.style.setProperty('--bg-surface-high', tokens.bg.surfaceHigh)
  root.style.setProperty('--border-subtle', tokens.border.subtle)
  root.style.setProperty('--border-strong', tokens.border.strong)
  root.style.setProperty('--text-primary', tokens.text.primary)
  root.style.setProperty('--text-muted', tokens.text.muted)
  root.style.setProperty('--text-inverse', tokens.text.inverse)
  root.style.setProperty('--accent-primary', tokens.accent.primary)
  root.style.setProperty('--accent-secondary', tokens.accent.secondary)
  root.style.setProperty('--accent-danger', tokens.accent.danger)
  root.style.setProperty('--accent-success', tokens.accent.success)
  root.style.setProperty('--accent-warning', tokens.accent.warning)
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

