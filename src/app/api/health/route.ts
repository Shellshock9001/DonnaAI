import { NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'

export async function GET(): Promise<NextResponse> {
  try {
    // Check database connection
    const pool = getDatabasePool()
    await pool.query('SELECT 1')
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'operational',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: 'disconnected',
          api: 'operational',
        },
      },
      { status: 503 }
    )
  }
}

