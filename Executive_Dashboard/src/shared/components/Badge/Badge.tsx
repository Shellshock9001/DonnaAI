import React from 'react'
import { cn } from '@/shared/utils/cn'

export interface Props {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: Props): JSX.Element {
  const baseClasses = 'inline-flex items-center rounded-sm font-medium border'
  
  const variantClasses = {
    default: 'bg-[var(--bg-surface-high)] border-[var(--border-subtle)] text-[var(--text-primary)]',
    success: 'bg-[var(--accent-success)] border-[var(--accent-success)] text-[var(--text-inverse)]',
    warning: 'bg-[var(--accent-warning)] border-[var(--accent-warning)] text-[var(--text-inverse)]',
    danger: 'bg-[var(--accent-danger)] border-[var(--accent-danger)] text-[var(--text-inverse)]',
    info: 'bg-[var(--accent-primary)] border-[var(--accent-primary)] text-[var(--text-inverse)]',
  }

  const sizeClasses = {
    sm: 'px-xs py-xs text-xs',
    md: 'px-sm py-sm text-sm',
  }

  return (
    <span
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  )
}

