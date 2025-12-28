#!/usr/bin/env node
/**
 * Interactive .env setup script
 * Helps configure environment variables for Donna AI Executive Dashboard
 */

const fs = require('fs')
const readline = require('readline')
const crypto = require('crypto')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

function generateSecret(length = 32) {
  return crypto.randomBytes(length).toString('hex')
}

async function setupEnv() {
  console.log('🐉 Donna AI - Environment Configuration')
  console.log('=======================================')
  console.log('')
  console.log('Automatically configuring .env file with admin1 credentials...')
  console.log('(No prompts - using defaults from accounts.md)\n')

  const env = {}

  // Database Configuration
  // Automatically use admin1 account credentials for PostgreSQL (no prompts!)
  const ADMIN1_EMAIL = 'admin1@kcccapital.com'
  const ADMIN1_PASSWORD = 'Admin1@KCC2024!Secure'
  const ADMIN1_USERNAME = 'admin1'
  
  console.log('📊 Database Configuration')
  console.log('-------------------------')
  console.log(`✓ Using admin1 account credentials automatically:`)
  console.log(`  Username: ${ADMIN1_USERNAME}`)
  console.log(`  Password: ${ADMIN1_PASSWORD.substring(0, 10)}...`)
  console.log(`  Host: localhost`)
  console.log(`  Port: 5432`)
  console.log(`  Database: donna_ai`)
  console.log('')
  
  // Use admin1 credentials automatically - no prompts!
  const dbUser = ADMIN1_USERNAME
  const dbPassword = ADMIN1_PASSWORD
  const dbHost = 'localhost'
  const dbPort = '5432'
  const dbName = 'donna_ai'

  // URL-encode the password to handle special characters (@, !, etc.)
  const encodedPassword = encodeURIComponent(dbPassword)
  
  env.DATABASE_URL = `postgresql://${dbUser}:${encodedPassword}@${dbHost}:${dbPort}/${dbName}`
  env.DIRECT_URL = env.DATABASE_URL

  console.log('')

  // JWT Secrets - Generate automatically
  console.log('🔐 JWT Secrets')
  console.log('-------------')
  console.log('✓ Generating secure random secrets automatically...')
  env.JWT_SECRET = generateSecret()
  env.JWT_REFRESH_SECRET = generateSecret()
  
  // Encryption Key - Generate automatically (for API key encryption)
  console.log('🔒 Encryption Key')
  console.log('-----------------')
  console.log('✓ Generating encryption key for API key storage...')
  env.ENCRYPTION_KEY = generateSecret(64) // Longer key for encryption
  console.log('')

  // API Keys (Optional) - Use placeholders, can be updated later
  console.log('🤖 AI API Keys')
  console.log('-------------')
  console.log('✓ Using placeholder values (update in .env later if needed)')
  console.log('')

  env.OPENAI_API_KEY = 'your-openai-api-key'
  env.GEMINI_API_KEY = 'your-gemini-api-key'
  env.PERPLEXITY_API_KEY = 'your-perplexity-api-key'
  env.TAVILY_API_KEY = 'your-tavily-api-key'
  env.APOLLO_API_KEY = 'your-apollo-api-key'

  // MinIO Configuration - Use defaults
  console.log('💾 MinIO Configuration')
  console.log('---------------------')
  console.log('✓ Using default MinIO settings')
  console.log('')

  env.MINIO_ENDPOINT = 'localhost'
  env.MINIO_PORT = '9000'
  env.MINIO_ACCESS_KEY = 'minioadmin'
  env.MINIO_SECRET_KEY = 'minioadmin'
  env.MINIO_USE_SSL = 'false'

  // App Configuration - Use defaults
  console.log('🌐 App Configuration')
  console.log('--------------------')
  console.log('✓ Using default app settings')
  console.log('')

  env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
  env.NODE_ENV = 'development'

  // Generate .env file content
  const envContent = `# Database
DATABASE_URL=${env.DATABASE_URL}
DIRECT_URL=${env.DIRECT_URL}

# JWT
JWT_SECRET=${env.JWT_SECRET}
JWT_REFRESH_SECRET=${env.JWT_REFRESH_SECRET}

# Encryption (for API key storage)
ENCRYPTION_KEY=${env.ENCRYPTION_KEY}

# OpenAI
OPENAI_API_KEY=${env.OPENAI_API_KEY}

# Gemini
GEMINI_API_KEY=${env.GEMINI_API_KEY}

# Perplexity
PERPLEXITY_API_KEY=${env.PERPLEXITY_API_KEY}

# Tavily
TAVILY_API_KEY=${env.TAVILY_API_KEY}

# Apollo.io
APOLLO_API_KEY=${env.APOLLO_API_KEY}

# MinIO
MINIO_ENDPOINT=${env.MINIO_ENDPOINT}
MINIO_PORT=${env.MINIO_PORT}
MINIO_ACCESS_KEY=${env.MINIO_ACCESS_KEY}
MINIO_SECRET_KEY=${env.MINIO_SECRET_KEY}
MINIO_USE_SSL=${env.MINIO_USE_SSL}

# App
NEXT_PUBLIC_APP_URL=${env.NEXT_PUBLIC_APP_URL}
NODE_ENV=${env.NODE_ENV}
`

  // Write .env file
  fs.writeFileSync('.env', envContent)
  console.log('')
  console.log('✅ .env file created successfully!')
  console.log('')
  console.log('Next steps:')
  console.log('  1. Create PostgreSQL user and database:')
  console.log('     psql -U postgres')
  console.log('     CREATE USER admin1 WITH PASSWORD \'Admin1@KCC2024!Secure\';')
  console.log('     CREATE DATABASE donna_ai OWNER admin1;')
  console.log('     GRANT ALL PRIVILEGES ON DATABASE donna_ai TO admin1;')
  console.log('     \\q')
  console.log('  2. Run: npm run db:migrate')
  console.log('  3. Run: npm run db:create-accounts')
  console.log('  4. Run: npm run dev')
  console.log('')

  rl.close()
}

setupEnv().catch((error) => {
  console.error('Error:', error)
  rl.close()
  process.exit(1)
})

