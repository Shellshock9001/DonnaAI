'use client'

import React, { useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/shared/auth/useAuth'

export interface Props {
  // UserMenu component has no props
}

export default function UserMenu(_props: Props = {}): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  if (!user) {
    return <></>
  }

  return (
    <div className="absolute top-md right-md z-[1000]">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-sm bg-[var(--bg-surface-low)] rounded-md px-md py-sm border border-[var(--border-subtle)] hover:bg-[var(--bg-surface-high)] transition-all duration-200"
          aria-label="User menu"
        >
          <User className="w-4 h-4" />
          <span className="text-sm text-[var(--text-primary)]">{user.email}</span>
        </button>
        
        {isOpen && (
          <div className="absolute top-full right-0 mt-xs bg-[var(--bg-surface-low)] border border-[var(--border-subtle)] rounded-md min-w-[200px]">
            <button
              onClick={() => {
                logout()
                setIsOpen(false)
              }}
              className="w-full flex items-center gap-sm px-md py-sm text-sm text-[var(--text-primary)] hover:bg-[var(--bg-surface-high)] transition-all duration-200"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

