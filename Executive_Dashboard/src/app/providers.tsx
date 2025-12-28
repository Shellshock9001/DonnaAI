'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from '@/shared/theme'
import { CompanyProvider } from '@/shared/providers/CompanyProvider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
})

interface Props {
  children: React.ReactNode
}

export function Providers({ children }: Props): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <CompanyProvider>
          {children}
        </CompanyProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

