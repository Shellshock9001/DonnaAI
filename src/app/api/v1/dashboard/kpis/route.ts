import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

async function getUserId(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string }
    return decoded.userId
  } catch {
    return null
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = await getUserId(request)
    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const pool = getDatabasePool()
    
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.substring(7)
    const decoded = jwt.verify(token!, JWT_SECRET) as { companyId: string }
    const companyId = decoded.companyId

    const [dealsResult, documentsResult, pipelineResult] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) as count FROM deals WHERE company_id = $1 AND deleted_at IS NULL',
        [companyId]
      ),
      pool.query(
        'SELECT COUNT(*) as count FROM documents WHERE company_id = $1 AND deleted_at IS NULL',
        [companyId]
      ),
      pool.query(
        'SELECT COALESCE(SUM(value), 0) as total FROM deals WHERE company_id = $1 AND deleted_at IS NULL',
        [companyId]
      ),
    ])

    const activeDeals = parseInt(dealsResult.rows[0].count)
    const totalDocuments = parseInt(documentsResult.rows[0].count)
    const pipelineValue = parseFloat(pipelineResult.rows[0].total)

    const kpis = [
      {
        label: 'Active Deals',
        value: activeDeals,
        trend: 0,
        icon: 'deal',
      },
      {
        label: 'Pipeline Value',
        value: `$${(pipelineValue / 1000000).toFixed(1)}M`,
        trend: 0,
        icon: 'pipeline',
      },
      {
        label: 'Total Documents',
        value: totalDocuments,
        trend: 0,
        icon: 'document',
      },
      {
        label: 'Documents Generated',
        value: 0,
        trend: 0,
        icon: 'generated',
      },
    ]

    return NextResponse.json({ data: kpis })
  } catch (error) {
    console.error('Dashboard KPIs error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch KPIs' } },
      { status: 500 }
    )
  }
}

