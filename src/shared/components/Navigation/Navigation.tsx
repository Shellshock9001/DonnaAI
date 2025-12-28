'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Network, 
  FileText, 
  Search, 
  FileEdit, 
  Shield, 
  BarChart3, 
  Clock, 
  Settings, 
  HelpCircle 
} from 'lucide-react'
import { cn } from '@/shared/utils/cn'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Network', href: '/network', icon: Network },
  { label: 'Documents', href: '/documents', icon: FileText },
  { label: 'AI Search', href: '/search', icon: Search },
  { label: 'Generate', href: '/generate', icon: FileEdit },
  { label: 'Compliance', href: '/compliance', icon: Shield },
  { label: 'ML Ops', href: '/ml-ops', icon: BarChart3 },
  { label: 'Time Tracking', href: '/time-tracking', icon: Clock },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Help', href: '/help', icon: HelpCircle },
]

export interface Props {
  // Navigation component has no props
}

export default function Navigation(_props: Props = {}): JSX.Element {
  const pathname = usePathname()

  return (
    <nav className="w-[240px] h-screen sticky top-0 bg-[var(--bg-surface-low)] border-r border-[var(--border-subtle)] flex flex-col">
      <div className="p-xl border-b border-[var(--border-subtle)]">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Donna AI</h1>
      </div>
      <div className="flex-1 overflow-y-auto py-md">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-md px-md py-md mx-md mb-xs rounded-md transition-all duration-200',
                isActive
                  ? 'bg-[var(--bg-surface-high)] border-l-[3px] border-[var(--border-strong)] text-[var(--text-primary)]'
                  : 'text-[var(--text-muted)] hover:opacity-80 hover:bg-[var(--bg-surface-high)]'
              )}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

