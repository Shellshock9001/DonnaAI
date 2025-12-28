'use client'

import React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card } from '@/shared/components/Card'
import { Badge } from '@/shared/components/Badge'
import { api } from '@/shared/api/client'
import { LayoutDashboard, Network, FileText, TrendingUp } from 'lucide-react'
import { DashboardKpi, SystemHealth, IntelligenceAlert } from './types'

export interface Props {
  // Dashboard component has no props
}

export default function Dashboard(_props: Props = {}): JSX.Element {
  const { data: kpis } = useQuery<DashboardKpi[]>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const response = await api.get<DashboardKpi[]>('/api/v1/dashboard/kpis')
      return response.data
    },
  })

  const { data: health } = useQuery<SystemHealth>({
    queryKey: ['dashboard', 'health'],
    queryFn: async () => {
      const response = await api.get<SystemHealth>('/api/v1/dashboard/health')
      return response.data
    },
    refetchInterval: 10000,
  })

  const { data: alerts } = useQuery<IntelligenceAlert[]>({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const response = await api.get<IntelligenceAlert[]>('/api/v1/dashboard/alerts')
      return response.data
    },
  })

  return (
    <div className="space-y-xl">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-xl">Dashboard</h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
        {kpis?.map((kpi) => (
          <Card key={kpi.label} variant="default">
            <div className="flex items-start justify-between mb-md">
              <div>
                <p className="text-sm text-[var(--text-muted)] mb-xs">{kpi.label}</p>
                <p className="text-2xl font-semibold text-[var(--text-primary)]">{kpi.value}</p>
              </div>
              {kpi.trend !== undefined && (
                <div className={`flex items-center ${kpi.trend >= 0 ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm ml-xs">{Math.abs(kpi.trend)}%</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* System Health & Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">System Health</h2>
          {health && (
            <div className="space-y-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">API Latency</span>
                <Badge variant={health.apiLatency < 200 ? 'success' : health.apiLatency < 500 ? 'warning' : 'danger'}>
                  {health.apiLatency}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">Database Latency</span>
                <Badge variant={health.databaseLatency < 50 ? 'success' : health.databaseLatency < 100 ? 'warning' : 'danger'}>
                  {health.databaseLatency}ms
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">AI Gateway</span>
                <Badge variant={health.aiGatewayStatus === 'healthy' ? 'success' : health.aiGatewayStatus === 'degraded' ? 'warning' : 'danger'}>
                  {health.aiGatewayStatus}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)]">RAG Performance</span>
                <Badge variant={health.ragPerformance > 0.8 ? 'success' : health.ragPerformance > 0.6 ? 'warning' : 'danger'}>
                  {(health.ragPerformance * 100).toFixed(0)}%
                </Badge>
              </div>
            </div>
          )}
        </Card>

        <Card variant="default">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-md">Intelligence Panel</h2>
          <div className="space-y-sm">
            {alerts && alerts.length > 0 ? (
              alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-sm bg-[var(--bg-surface-high)] rounded-md">
                  <div className="flex items-start justify-between">
                    <p className="text-sm text-[var(--text-primary)]">{alert.message}</p>
                    <Badge variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'error' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-xs">{new Date(alert.timestamp).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[var(--text-muted)]">No alerts</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

