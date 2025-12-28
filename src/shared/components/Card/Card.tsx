import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface Props {
  children: React.ReactNode
  variant?: 'default' | 'elevated' | 'glass'
  className?: string
  onClick?: () => void
  'aria-label'?: string
}

export default function Card({ 
  children, 
  variant = 'default', 
  className,
  onClick,
  'aria-label': ariaLabel 
}: Props): JSX.Element {
  const baseClasses = 'rounded-lg p-lg border transition-all duration-200'
  
  const variantClasses = {
    default: 'bg-[var(--bg-surface-low)] border-[var(--border-subtle)]',
    elevated: 'bg-[var(--bg-surface-high)] border-[var(--border-subtle)]',
    glass: 'bg-[var(--bg-surface-low)] border-[var(--border-subtle)] backdrop-blur-md',
  }

  const interactiveClasses = onClick 
    ? 'cursor-pointer hover:opacity-80 hover:bg-[var(--bg-surface-high)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2' 
    : ''

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], interactiveClasses, className)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  )
}

