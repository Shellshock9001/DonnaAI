import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import { dealSchema } from '@/shared/validation/schemas'
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
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
      `SELECT id, name, stage, value, currency, sector, health_score, created_at, updated_at 
       FROM deals 
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [params.id, auth.companyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Deal not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result.rows[0] })
  } catch (error) {
    console.error('Deal GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch deal' } },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validated = dealSchema.partial().parse(body)

    const pool = getDatabasePool()
    
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (validated.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(validated.name)
    }
    if (validated.stage !== undefined) {
      updates.push(`stage = $${paramIndex++}`)
      values.push(validated.stage)
    }
    if (validated.value !== undefined) {
      updates.push(`value = $${paramIndex++}`)
      values.push(validated.value)
    }
    if (validated.currency !== undefined) {
      updates.push(`currency = $${paramIndex++}`)
      values.push(validated.currency)
    }
    if (validated.sector !== undefined) {
      updates.push(`sector = $${paramIndex++}`)
      values.push(validated.sector)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
        { status: 400 }
      )
    }

    values.push(params.id, auth.companyId)

    const result = await pool.query(
      `UPDATE deals 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} AND deleted_at IS NULL
       RETURNING id, name, stage, value, currency, sector, health_score, created_at, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Deal not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result.rows[0] })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 400 }
      )
    }

    console.error('Deal PATCH error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update deal' } },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const auth = await getAuthContext(request)
    if (!auth) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    const pool = getDatabasePool()
    await pool.query(
      `UPDATE deals 
       SET deleted_at = NOW() 
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [params.id, auth.companyId]
    )

    return NextResponse.json({ data: { success: true } }, { status: 204 })
  } catch (error) {
    console.error('Deal DELETE error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete deal' } },
      { status: 500 }
    )
  }
}

