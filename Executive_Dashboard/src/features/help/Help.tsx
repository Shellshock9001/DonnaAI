'use client'

import React from 'react'
import { Card } from '@/shared/components/Card'
import { HelpCircle } from 'lucide-react'

export interface Props {
  // Help component has no props
}

export default function Help(_props: Props = {}): JSX.Element {
  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-xl">Help Center</h1>
      </div>

      <Card variant="default">
        <div className="flex items-center gap-md mb-md">
          <HelpCircle className="w-6 h-6 text-[var(--accent-primary)]" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Documentation</h2>
        </div>
        <div className="space-y-md">
          <div>
            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-xs">Getting Started</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Welcome to Donna AI Executive Dashboard. This platform provides comprehensive M&A workflow management with AI-powered intelligence.
            </p>
          </div>
          <div>
            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-xs">Features</h3>
            <ul className="list-disc list-inside text-sm text-[var(--text-muted)] space-y-xs">
              <li>Dashboard: Executive overview and real-time monitoring</li>
              <li>Deal Management: Track deals through pipeline stages</li>
              <li>Documents: Virtual data room with document intelligence</li>
              <li>AI Search: Natural language queries with grounded RAG</li>
              <li>Network Intelligence: Relationship and company intelligence</li>
              <li>Compliance: FINRA/SEC compliance and audit logging</li>
            </ul>
          </div>
          <div>
            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-xs">Support</h3>
            <p className="text-sm text-[var(--text-muted)]">
              For support, please contact your system administrator or refer to the internal documentation.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

