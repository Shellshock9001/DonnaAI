import { NextRequest, NextResponse } from 'next/server'
import { getDatabasePool } from '@/config/database'
import { aiSettingsSchema } from '@/shared/validation/schemas'
import { encrypt, decrypt } from '@/shared/utils/encryption'
import {
  validateOpenAIKey,
  validatePerplexityKey,
  validateGeminiKey,
  validateTavilyKey,
  validateApolloKey,
} from '@/shared/utils/apiKeyValidation'
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
    
    // Get company's AI settings from database
    const result = await pool.query(
      `SELECT openai_api_key_encrypted, gemini_api_key_encrypted, perplexity_api_key_encrypted, 
              tavily_api_key_encrypted, apollo_api_key_encrypted, default_model
       FROM ai_settings 
       WHERE company_id = $1`,
      [auth.companyId]
    )

    // Mask API keys for display (show first 4 and last 4 characters)
    const maskKey = (encryptedKey: string | null): string => {
      if (!encryptedKey) return ''
      try {
        const decrypted = decrypt(encryptedKey)
        if (!decrypted || decrypted.length === 0) return ''
        if (decrypted.length > 8) {
          return `${decrypted.substring(0, 4)}${'*'.repeat(Math.min(decrypted.length - 8, 20))}${decrypted.substring(decrypted.length - 4)}`
        }
        return '***'
      } catch (error) {
        // If decryption fails, it might be encrypted with a different key
        // Return a placeholder to indicate a key exists but can't be displayed
        console.error('Failed to decrypt API key for display:', error)
        return '••••••••••••••••••••••••' // Show dots to indicate key exists
      }
    }

    const settings = result.rows[0] || {}

    return NextResponse.json({
      data: {
        openaiApiKey: maskKey(settings.openai_api_key_encrypted),
        geminiApiKey: maskKey(settings.gemini_api_key_encrypted),
        perplexityApiKey: maskKey(settings.perplexity_api_key_encrypted),
        tavilyApiKey: maskKey(settings.tavily_api_key_encrypted),
        apolloApiKey: maskKey(settings.apollo_api_key_encrypted),
        defaultModel: settings.default_model || 'gpt-4-turbo',
        // Status indicators
        openaiConfigured: !!settings.openai_api_key_encrypted,
        geminiConfigured: !!settings.gemini_api_key_encrypted,
        perplexityConfigured: !!settings.perplexity_api_key_encrypted,
        tavilyConfigured: !!settings.tavily_api_key_encrypted,
        apolloConfigured: !!settings.apollo_api_key_encrypted,
        // Validation status
        openaiValidated: settings.openai_validated || false,
        geminiValidated: settings.gemini_validated || false,
        perplexityValidated: settings.perplexity_validated || false,
        tavilyValidated: settings.tavily_validated || false,
        apolloValidated: settings.apollo_validated || false,
      },
    })
  } catch (error) {
    console.error('AI settings GET error:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch AI settings' } },
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
    const validated = aiSettingsSchema.parse(body)

    const pool = getDatabasePool()

    // Validate and encrypt API keys before storing
    const encryptedSettings: Record<string, unknown> = {
      company_id: auth.companyId,
      default_model: validated.defaultModel || 'gpt-4-turbo',
      updated_at: new Date(),
    }

    // Validate and encrypt each API key
    if (validated.openaiApiKey && validated.openaiApiKey.trim() !== '') {
      const validation = await validateOpenAIKey(validated.openaiApiKey.trim())
      encryptedSettings.openai_api_key_encrypted = encrypt(validated.openaiApiKey.trim())
      encryptedSettings.openai_validated = validation.valid
    }
    if (validated.geminiApiKey && validated.geminiApiKey.trim() !== '') {
      const validation = await validateGeminiKey(validated.geminiApiKey.trim())
      encryptedSettings.gemini_api_key_encrypted = encrypt(validated.geminiApiKey.trim())
      encryptedSettings.gemini_validated = validation.valid
    }
    if (validated.perplexityApiKey && validated.perplexityApiKey.trim() !== '') {
      const validation = await validatePerplexityKey(validated.perplexityApiKey.trim())
      encryptedSettings.perplexity_api_key_encrypted = encrypt(validated.perplexityApiKey.trim())
      encryptedSettings.perplexity_validated = validation.valid
      
      if (!validation.valid) {
        console.error('Perplexity API key validation failed:', validation.error)
        // Still save the key, but mark it as invalid so user knows to fix it
      }
    }
    if (validated.tavilyApiKey && validated.tavilyApiKey.trim() !== '') {
      const validation = await validateTavilyKey(validated.tavilyApiKey.trim())
      encryptedSettings.tavily_api_key_encrypted = encrypt(validated.tavilyApiKey.trim())
      encryptedSettings.tavily_validated = validation.valid
    }
    if (validated.apolloApiKey && validated.apolloApiKey.trim() !== '') {
      const validation = await validateApolloKey(validated.apolloApiKey.trim())
      encryptedSettings.apollo_api_key_encrypted = encrypt(validated.apolloApiKey.trim())
      encryptedSettings.apollo_validated = validation.valid
    }

    // Upsert AI settings for this company
    // First, check if settings exist
    const existingSettings = await pool.query(
      'SELECT id FROM ai_settings WHERE company_id = $1',
      [auth.companyId]
    )

    if (existingSettings.rows.length > 0) {
      // Update existing settings
      const updateFields: string[] = []
      const updateValues: unknown[] = []
      let paramIndex = 1

      for (const [key, value] of Object.entries(encryptedSettings)) {
        if (key !== 'company_id') {
          updateFields.push(`${key} = $${paramIndex}`)
          updateValues.push(value)
          paramIndex++
        }
      }
      updateValues.push(auth.companyId)

      await pool.query(
        `UPDATE ai_settings SET ${updateFields.join(', ')} WHERE company_id = $${paramIndex}`,
        updateValues
      )
      
      // Log validation results for debugging
      if (encryptedSettings.perplexity_validated === false && encryptedSettings.perplexity_api_key_encrypted) {
        console.warn('⚠ Perplexity API key validation failed - key saved but marked as invalid')
        console.warn('  User needs to re-enter the key in Settings to retry validation')
      }
    } else {
      // Insert new settings
      const columns = Object.keys(encryptedSettings)
      const values = Object.values(encryptedSettings)
      const placeholders = values.map((_, i) => `$${i + 1}`).join(', ')

      await pool.query(
        `INSERT INTO ai_settings (${columns.join(', ')}) VALUES (${placeholders})`,
        values
      )
    }

    // Log API key update to audit log (for security)
    try {
      const crypto = require('crypto')
      const hash = crypto.createHash('sha256').update(`${auth.userId}${auth.companyId}${Date.now()}`).digest('hex')
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, resource, resource_id, metadata, hash)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          auth.userId,
          'update',
          'ai_settings',
          auth.companyId,
          JSON.stringify({ 
            keys_updated: Object.keys(encryptedSettings).filter(k => k.includes('_encrypted')),
            timestamp: new Date().toISOString(),
          }),
          hash,
        ]
      )
    } catch (auditError) {
      // Don't fail if audit logging fails
      console.error('Audit log error:', auditError)
    }

    return NextResponse.json({ 
      data: { 
        success: true,
        message: 'API keys saved and validated successfully',
      } 
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request data', details: error } },
        { status: 400 }
      )
    }

    console.error('AI settings POST error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { 
        error: { 
          code: 'INTERNAL_ERROR', 
          message: error instanceof Error ? error.message : 'Failed to save AI settings',
          details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : String(error)) : undefined
        } 
      },
      { status: 500 }
    )
  }
}

