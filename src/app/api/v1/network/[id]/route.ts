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
      `SELECT id, name, email, company, role, location, sectors, tags, trust_score, created_at, updated_at 
       FROM network_members 
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [params.id, auth.companyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Network member not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result.rows[0] })
  } catch (error) {
    console.error('Network member GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch network member' } },
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
    const validated = networkMemberSchema.partial().parse(body)

    const pool = getDatabasePool()
    
    const updates: string[] = []
    const values: unknown[] = []
    let paramIndex = 1

    if (validated.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(validated.name)
    }
    if (validated.email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(validated.email)
    }
    if (validated.company !== undefined) {
      updates.push(`company = $${paramIndex++}`)
      values.push(validated.company)
    }
    if (validated.role !== undefined) {
      updates.push(`role = $${paramIndex++}`)
      values.push(validated.role)
    }
    if (validated.location !== undefined) {
      updates.push(`location = $${paramIndex++}`)
      values.push(validated.location)
    }
    if (validated.sectors !== undefined) {
      updates.push(`sectors = $${paramIndex++}`)
      values.push(validated.sectors)
    }
    if (validated.tags !== undefined) {
      updates.push(`tags = $${paramIndex++}`)
      values.push(validated.tags)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'No fields to update' } },
        { status: 400 }
      )
    }

    values.push(params.id, auth.companyId)

    const result = await pool.query(
      `UPDATE network_members 
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex++} AND company_id = $${paramIndex++} AND deleted_at IS NULL
       RETURNING id, name, email, company, role, location, sectors, tags, trust_score, created_at, updated_at`,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Network member not found' } },
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

    console.error('Network member PATCH error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to update network member' } },
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
      `UPDATE network_members 
       SET deleted_at = NOW() 
       WHERE id = $1 AND company_id = $2 AND deleted_at IS NULL`,
      [params.id, auth.companyId]
    )

    return NextResponse.json({ data: { success: true } }, { status: 204 })
  } catch (error) {
    console.error('Network member DELETE error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to delete network member' } },
      { status: 500 }
    )
  }
}

