export type Theme = 'calm-bento' | 'light-minimal' | 'cyber-bento'

export interface ThemeTokens {
  bg: {
    page: string
    surfaceLow: string
    surfaceHigh: string
  }
  border: {
    subtle: string
    strong: string
  }
  text: {
    primary: string
    muted: string
    inverse: string
  }
  accent: {
    primary: string
    secondary: string
    highlight: string
    danger: string
    success: string
    warning: string
  }
}

export interface ThemeConfig {
  name: Theme
  tokens: ThemeTokens
}

