import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import { networkMemberSchema } from '@/shared/validation/schemas'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

async function getAuthContext(request: NextRequest): Promise<{ userId: string; companyId: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; companyId: string }
    return decoded
  } catch {
    return null
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const pool = getDatabasePool()
    const result = await pool.query(
      `SELECT id, name, email, company, role, location, sectors, tags, trust_score, created_at, updated_at 
       FROM network_members 
       WHERE company_id = $1 AND deleted_at IS NULL 
       ORDER BY created_at DESC`,
      [auth.companyId]
    )

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    console.error('Network GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch network members' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = networkMemberSchema.parse(body)

    const pool = getDatabasePool()
    const result = await pool.query(
      `INSERT INTO network_members (name, email, company, role, location, sectors, tags, company_id, created_by_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, name, email, company, role, location, sectors, tags, trust_score, created_at, updated_at`,
      [
        validated.name,
        validated.email || null,
        validated.company || null,
        validated.role || null,
        validated.location || null,
        validated.sectors,
        validated.tags,
        auth.companyId,
        auth.userId,
      ]
    )

    return NextResponse.json({ data: result.rows[0] }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 400 }
      )
    }

    console.error('Network POST error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create network member' } },
      { status: 500 }
    )
  }
}

