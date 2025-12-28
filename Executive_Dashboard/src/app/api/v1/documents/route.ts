import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

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

    const { searchParams } = new URL(request.url)
    const dealId = searchParams.get('dealId')

    const pool = getDatabasePool()
    let query = `SELECT id, name, file_name, file_size, mime_type, status, deal_id, created_at, updated_at 
                 FROM documents 
                 WHERE company_id = $1 AND deleted_at IS NULL`
    const params: unknown[] = [auth.companyId]

    if (dealId) {
      query += ' AND deal_id = $2'
      params.push(dealId)
    }

    query += ' ORDER BY created_at DESC'

    const result = await pool.query(query, params)

    return NextResponse.json({ data: result.rows })
  } catch (error) {
    console.error('Documents GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch documents' } },
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

    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string
    const dealId = formData.get('dealId') as string | null

    if (!file) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'File is required' } },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex')

    const pool = getDatabasePool()

    const existingDoc = await pool.query(
      'SELECT id FROM documents WHERE file_hash = $1 AND company_id = $2 AND deleted_at IS NULL',
      [fileHash, auth.companyId]
    )

    if (existingDoc.rows.length > 0) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE', message: 'Document already exists' } },
        { status: 409 }
      )
    }

    const storagePath = `documents/${auth.companyId}/${Date.now()}-${file.name}`

    const result = await pool.query(
      `INSERT INTO documents (name, file_name, file_size, mime_type, file_hash, status, deal_id, company_id, uploaded_by_id, storage_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, name, file_name, file_size, mime_type, status, deal_id, created_at, updated_at`,
      [
        name || file.name,
        file.name,
        buffer.length,
        file.type,
        fileHash,
        'uploaded',
        dealId || null,
        auth.companyId,
        auth.userId,
        storagePath,
      ]
    )

    return NextResponse.json({ data: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Documents POST error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to upload document' } },
      { status: 500 }
    )
  }
}

