import { ThemeConfig } from './types'

export const themes: Record<string, ThemeConfig> = {
  'calm-bento': {
    name: 'calm-bento',
    tokens: {
      bg: {
        page: '#050816',
        surfaceLow: '#0A1024',
        surfaceHigh: '#101733',
      },
      border: {
        subtle: '#1C2442',
        strong: '#2F81FF',
      },
      text: {
        primary: '#E4ECFF',
        muted: '#8B93B5',
        inverse: '#050816',
      },
      accent: {
        primary: '#2F81FF',
        secondary: '#7A4DFF',
        highlight: 'linear-gradient(135deg, #2F81FF 0%, #7A4DFF 100%)',
        danger: '#FF4B5C',
        success: '#3DD68C',
        warning: '#FFC857',
      },
    },
  },
  'light-minimal': {
    name: 'light-minimal',
    tokens: {
      bg: {
        page: '#F3F5F7',
        surfaceLow: '#FFFFFF',
        surfaceHigh: '#F8FAFB',
      },
      border: {
        subtle: '#D8DFE5',
        strong: '#2F81FF',
      },
      text: {
        primary: '#1E2330',
        muted: '#7A8090',
        inverse: '#F3F5F7',
      },
      accent: {
        primary: '#2F81FF',
        secondary: '#3BAE82',
        highlight: 'linear-gradient(135deg, #2F81FF 0%, #3BAE82 100%)',
        danger: '#FF4B5C',
        success: '#3DD68C',
        warning: '#FFC857',
      },
    },
  },
  'cyber-bento': {
    name: 'cyber-bento',
    tokens: {
      bg: {
        page: '#03040B',
        surfaceLow: '#070A16',
        surfaceHigh: '#0D1022',
      },
      border: {
        subtle: '#252B4A',
        strong: '#3CF2FF',
      },
      text: {
        primary: '#E7EDFF',
        muted: '#9097C2',
        inverse: '#03040B',
      },
      accent: {
        primary: '#3CF2FF',
        secondary: '#D34DFF',
        highlight: 'linear-gradient(135deg, #3CF2FF 0%, #D34DFF 100%)',
        danger: '#FF4B5C',
        success: '#3DD68C',
        warning: '#FFC857',
      },
    },
  },
}

