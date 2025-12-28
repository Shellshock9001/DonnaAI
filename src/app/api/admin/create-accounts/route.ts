import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production'

async function getAuthContext(request: NextRequest): Promise<{ userId: string; role: string } | null> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string }
    return decoded
  } catch {
    return null
  }
}

const accounts = [
  {
    email: 'admin1@kcccapital.com',
    password: 'Admin1@KCC2024!Secure',
    role: 'admin',
    fullName: 'Admin User 1',
  },
  {
    email: 'admin2@kcccapital.com',
    password: 'Admin2@KCC2024!Secure',
    role: 'admin',
    fullName: 'Admin User 2',
  },
  {
    email: 'manager1@kcccapital.com',
    password: 'Manager1@KCC2024!',
    role: 'vp',
    fullName: 'Manager User 1',
  },
  {
    email: 'manager2@kcccapital.com',
    password: 'Manager2@KCC2024!',
    role: 'vp',
    fullName: 'Manager User 2',
  },
  {
    email: 'user1@kcccapital.com',
    password: 'User1@KCC2024!',
    role: 'analyst',
    fullName: 'Standard User 1',
  },
  {
    email: 'user2@kcccapital.com',
    password: 'User2@KCC2024!',
    role: 'analyst',
    fullName: 'Standard User 2',
  },
]

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Check authentication (optional - can be removed for initial setup)
    const auth = await getAuthContext(request)
    if (auth && auth.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only admins can create accounts' } },
        { status: 403 }
      )
    }

    const pool = getDatabasePool()

    // Get or create default company
    let companyResult = await pool.query(
      `SELECT id FROM companies WHERE tenant_id = 'kcc-capital-partners' LIMIT 1`
    )

    let companyId: string
    if (companyResult.rows.length === 0) {
      const newCompany = await pool.query(
        `INSERT INTO companies (name, tenant_id)
         VALUES ('KCC Capital Partners', 'kcc-capital-partners')
         RETURNING id`
      )
      companyId = newCompany.rows[0].id
    } else {
      companyId = companyResult.rows[0].id
    }

    const createdAccounts = []
    const skippedAccounts = []

    for (const account of accounts) {
      // Check if user already exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
        [account.email]
      )

      if (existingUser.rows.length > 0) {
        skippedAccounts.push(account.email)
        continue
      }

      // Hash password
      const passwordHash = await bcrypt.hash(account.password, 10)

      // Create user
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, role, company_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role`,
        [account.email, passwordHash, account.role, companyId]
      )

      createdAccounts.push({
        email: userResult.rows[0].email,
        role: userResult.rows[0].role,
        fullName: account.fullName,
      })
    }

    return NextResponse.json({
      data: {
        created: createdAccounts.length,
        skipped: skippedAccounts.length,
        accounts: createdAccounts,
        skipped: skippedAccounts,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create accounts error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to create accounts' } },
      { status: 500 }
    )
  }
}

