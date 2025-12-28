'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Clock } from 'lucide-react'

export interface Props {
  // TimeTracking component has no props
}

export default function TimeTracking(_props: Props = {}): JSX.Element {
  const { data: stats } = useQuery({
    queryKey: ['time-tracking', 'stats'],
    queryFn: async () => {
      return {
        totalTimeSaved: 0,
        roi: 0,
        activeUsers: 0,
        operationBreakdown: [],
      }
    },
  })

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-xl">Time Tracking</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <Card variant="default">
          <div className="flex items-center gap-md mb-md">
            <Clock className="w-6 h-6 text-[var(--accent-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Time Saved</h2>
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {stats?.totalTimeSaved || 0} hours
          </p>
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">ROI</h2>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {stats ? `$${stats.roi.toFixed(2)}` : '$0.00'}
          </p>
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Active Users</h2>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {stats?.activeUsers || 0}
          </p>
        </Card>
      </div>

      <Card variant="default">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Operation Breakdown</h2>
        {stats?.operationBreakdown && stats.operationBreakdown.length > 0 ? (
          <div className="space-y-sm">
            {stats.operationBreakdown.map((op: unknown) => (
              <div key={Math.random()} className="p-md bg-[var(--bg-surface-high)] rounded-md">
                <p className="text-sm text-[var(--text-primary)]">Operation</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No operations tracked yet</p>
        )}
      </Card>
    </div>
  )
}

