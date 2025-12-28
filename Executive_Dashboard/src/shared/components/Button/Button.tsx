import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface Props {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  'aria-label'?: string
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  type = 'button',
  disabled = false,
  'aria-label': ariaLabel,
}: Props): JSX.Element {
  const baseClasses = 'rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'bg-[var(--accent-primary)] text-[var(--text-inverse)] hover:opacity-90',
    secondary: 'bg-transparent border border-[var(--accent-primary)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-[var(--text-inverse)]',
    tertiary: 'bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface-high)]',
    destructive: 'bg-[var(--accent-danger)] text-[var(--text-inverse)] hover:opacity-90',
  }

  const sizeClasses = {
    sm: 'px-sm py-sm text-sm',
    md: 'px-md py-md text-md',
    lg: 'px-lg py-lg text-lg',
  }

  return (
    <button
      type={type}
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {children}
    </button>
  )
}

