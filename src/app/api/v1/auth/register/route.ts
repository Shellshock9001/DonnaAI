import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import { loginSchema } from '@/shared/validation/schemas'
import bcrypt from 'bcrypt'
import { z } from 'zod'

const registerSchema = loginSchema.extend({
  companyName: z.string().min(1, 'Company name is required'),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    const pool = getDatabasePool()

    // Create company
    const companyResult = await pool.query(
      `INSERT INTO companies (name, tenant_id)
       VALUES ($1, $2)
       RETURNING id`,
      [validated.companyName, validated.companyName.toLowerCase().replace(/\s+/g, '-')]
    )
    const companyId = companyResult.rows[0].id

    // Create user
    const passwordHash = await bcrypt.hash(validated.password, 10)
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, role, company_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, company_id`,
      [validated.email, passwordHash, 'analyst', companyId]
    )

    const user = userResult.rows[0]

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
        },
      },
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } },
      { status: 500 }
    )
  }
}

