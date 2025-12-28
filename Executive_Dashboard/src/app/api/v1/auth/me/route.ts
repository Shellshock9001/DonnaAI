import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

interface JwtPayload {
  userId: string
  email: string
  role: string
  companyId: string
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Auth /me: Missing or invalid authorization header')
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Missing or invalid authorization header' } },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    if (!token || token.trim() === '') {
      console.error('Auth /me: Empty token')
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Empty token' } },
        { status: 401 }
      )
    }

    let decoded: JwtPayload
    try {
      decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    } catch (jwtError) {
      console.error('Auth /me: JWT verification failed:', jwtError)
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } },
        { status: 401 }
      )
    }

    const pool = getDatabasePool()
    const result = await pool.query(
      'SELECT id, email, role, company_id FROM users WHERE id = $1 AND deleted_at IS NULL',
      [decoded.userId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    const user = result.rows[0]

    return NextResponse.json({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
      },
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: { code: 'INVALID_TOKEN', message: 'Invalid token' } },
        { status: 401 }
      )
    }

    console.error('Auth error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred' } },
      { status: 500 }
    )
  }
}

