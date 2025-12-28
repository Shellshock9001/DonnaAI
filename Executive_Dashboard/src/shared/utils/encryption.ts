/**
 * Encryption utilities for sensitive data (API keys)
 * Uses AES-256-GCM encryption as per cursor rules
 */

import crypto from 'crypto'

// ENCRYPTION_KEY must be set in environment variables
// If not set, generate a stable key based on JWT_SECRET (fallback, but not recommended)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (process.env.JWT_SECRET ? crypto.createHash('sha256').update(process.env.JWT_SECRET + 'encryption-salt').digest('hex') : crypto.randomBytes(32).toString('hex'))
const ALGORITHM = 'aes-256-gcm'

function getKey(): Buffer {
  // Derive a 32-byte key from ENCRYPTION_KEY
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
  return key
}

export function encrypt(text: string): string {
  if (!text || text.trim() === '') return ''
  
  const key = getKey()
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const authTag = cipher.getAuthTag()
  
  // Return iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || encryptedText.trim() === '') return ''
  
  try {
    const parts = encryptedText.split(':')
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted format')
    }
    
    const [ivHex, authTagHex, encrypted] = parts
    const key = getKey()
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Decryption error:', error)
    return ''
  }
}

