export interface DashboardKpi {
  label: string
  value: string | number
  trend?: number
  icon: string
}

export interface SystemHealth {
  apiLatency: number
  databaseLatency: number
  aiGatewayStatus: 'healthy' | 'degraded' | 'down'
  ragPerformance: number
}

export interface DealActivity {
  date: string
  count: number
  value: number
}

export interface IntelligenceAlert {
  id: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  message: string
  timestamp: string
}

