'use client'

import React from 'react'
import { Navigation } from '@/shared/components/Navigation'
import { UserMenu } from '@/shared/components/UserMenu'

interface Props {
  children: React.ReactNode
}

export default function LayoutContent({ children }: Props): JSX.Element {
  return (
    <div className="flex min-h-screen">
      <Navigation />
      <main className="flex-1 relative">
        <UserMenu />
        <div className="max-w-[1400px] mx-auto px-xl py-xl">
          {children}
        </div>
      </main>
    </div>
  )
}

