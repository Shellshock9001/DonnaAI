'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { BarChart3 } from 'lucide-react'

export interface Props {
  // MlOps component has no props
}

export default function MlOps(_props: Props = {}): JSX.Element {
  const { data: metrics } = useQuery({
    queryKey: ['ml-ops', 'metrics'],
    queryFn: async () => {
      return {
        inferenceCount: 0,
        accuracy: 0.95,
        latency: 150,
        cost: 0,
        biasFlags: [],
      }
    },
  })

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-xl">ML Ops</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        <Card variant="default">
          <div className="flex items-center gap-md mb-md">
            <BarChart3 className="w-6 h-6 text-[var(--accent-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Inference Count</h2>
          </div>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{metrics?.inferenceCount || 0}</p>
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Accuracy</h2>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">
            {metrics ? (metrics.accuracy * 100).toFixed(1) : 0}%
          </p>
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Latency</h2>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">{metrics?.latency || 0}ms</p>
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Cost</h2>
          <p className="text-2xl font-semibold text-[var(--text-primary)]">${metrics?.cost || 0}</p>
        </Card>
      </div>

      <Card variant="default">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Bias Monitoring</h2>
        {metrics?.biasFlags && metrics.biasFlags.length > 0 ? (
          <div className="space-y-sm">
            {metrics.biasFlags.map((flag: string, idx: number) => (
              <Badge key={idx} variant="warning">
                {flag}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-[var(--text-muted)]">No bias flags detected</p>
        )}
      </Card>
    </div>
  )
}

