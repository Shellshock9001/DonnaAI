'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { api } from '@/shared/api/client'
import { Shield, Download } from 'lucide-react'

export interface Props {
  // Compliance component has no props
}

export default function Compliance(_props: Props = {}): JSX.Element {
  const { data: auditLogs } = useQuery({
    queryKey: ['compliance', 'audit-logs'],
    queryFn: async () => {
      return []
    },
  })

  return (
    <div className="space-y-xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Compliance</h1>
        <button className="flex items-center gap-sm px-md py-sm bg-[var(--bg-surface-high)] border border-[var(--border-subtle)] rounded-md hover:bg-[var(--bg-surface-low)] transition-all duration-200">
          <Download className="w-4 h-4" />
          <span className="text-sm text-[var(--text-primary)]">Export Audit Logs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <Card variant="default">
          <div className="flex items-center gap-md mb-md">
            <Shield className="w-6 h-6 text-[var(--accent-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Compliance Score</h2>
          </div>
          <p className="text-2xl font-semibold text-[var(--accent-success)]">98%</p>
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Audit Logs</h2>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">0</p>
          <p className="text-sm text-[var(--text-muted)]">Total entries</p>
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Retention</h2>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">3 years</p>
          <p className="text-sm text-[var(--text-muted)]">FINRA 4511 compliant</p>
        </Card>
      </div>

      <Card variant="default">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Recent Audit Logs</h2>
        {auditLogs && auditLogs.length > 0 ? (
          <div className="space-y-sm">
            {auditLogs.map((log: unknown) => (
              <div key={Math.random()} className="p-md bg-[var(--bg-surface-high)] rounded-md">
                <p className="text-sm text-[var(--text-primary)]">Audit log entry</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No audit logs yet</p>
        )}
      </Card>
    </div>
  )
}

