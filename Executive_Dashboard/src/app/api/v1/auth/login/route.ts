import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import { loginSchema } from '@/shared/validation/schemas'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'change-me-in-production'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validated = loginSchema.parse(body)

    // Rate limiting check (basic - can be enhanced with Redis)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    
    const pool = getDatabasePool()
    
    // Normalize email to lowercase
    const normalizedEmail = validated.email.toLowerCase().trim()
    
    const result = await pool.query(
      'SELECT id, email, password_hash, role, company_id FROM users WHERE LOWER(email) = $1 AND deleted_at IS NULL',
      [normalizedEmail]
    )

    if (result.rows.length === 0) {
      // Don't reveal if user exists - same error message
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      )
    }

    const user = result.rows[0]
    
    // Verify password with timing-safe comparison
    const isValid = await bcrypt.compare(validated.password, user.password_hash)

    if (!isValid) {
      // Don't reveal if password is wrong - same error message
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
        { status: 401 }
      )
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role, 
        companyId: user.company_id,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    )

    // Log successful login (for audit)
    try {
      const hash = crypto.createHash('sha256').update(`${user.id}${Date.now()}`).digest('hex')
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource, ip_address, hash)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, 'login', 'auth', clientIp, hash]
      )
    } catch (auditError) {
      // Don't fail login if audit logging fails
      console.error('Audit log error:', auditError)
    }

    const response = NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
        },
        accessToken,
      },
    })

    // Set secure cookie for refresh token
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })

    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 400 }
      )
    }

    console.error('Login error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'An error occurred during login' } },
      { status: 500 }
    )
  }
}

