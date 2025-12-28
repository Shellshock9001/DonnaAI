import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/shared/theme'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Donna AI Executive Dashboard',
  description: 'Enterprise M&A workflow platform with AI-powered intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

