'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

interface Company {
  id: string
  name: string
  tenantId: string
}

interface CompanyContextValue {
  company: Company | null
  setCompany: (company: Company | null) => void
}

const CompanyContext = createContext<CompanyContextValue | undefined>(undefined)

interface Props {
  children: React.ReactNode
}

export function CompanyProvider({ children }: Props): JSX.Element {
  const [company, setCompanyState] = useState<Company | null>(null)

  const setCompany = useCallback((newCompany: Company | null) => {
    setCompanyState(newCompany)
    if (newCompany) {
      localStorage.setItem('currentCompany', JSON.stringify(newCompany))
    } else {
      localStorage.removeItem('currentCompany')
    }
  }, [])

  React.useEffect(() => {
    const stored = localStorage.getItem('currentCompany')
    if (stored) {
      try {
        setCompanyState(JSON.parse(stored))
      } catch {
        // Invalid stored data
      }
    }
  }, [])

  return (
    <CompanyContext.Provider value={{ company, setCompany }}>
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany(): CompanyContextValue {
  const context = useContext(CompanyContext)
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider')
  }
  return context
}

