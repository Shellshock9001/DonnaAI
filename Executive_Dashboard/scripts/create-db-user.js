#!/usr/bin/env node
/**
 * Create PostgreSQL user and database programmatically
 * This works even if psql is not in PATH
 */

require('dotenv').config()
const { Pool } = require('pg')

async function createDbUser() {
  // Try to connect as postgres superuser first
  // Extract connection details from DATABASE_URL or use defaults
  const dbUrl = process.env.DATABASE_URL || 'postgresql://admin1:Admin1%40KCC2024%21Secure@localhost:5432/donna_ai'
  
  // Parse URL to get host, port
  const urlMatch = dbUrl.match(/postgresql:\/\/[^:]+:[^@]+@([^:]+):(\d+)\//)
  const host = urlMatch ? urlMatch[1] : 'localhost'
  const port = urlMatch ? urlMatch[2] : '5432'
  
  // Try common postgres passwords
  const passwords = [process.env.POSTGRES_PASSWORD, 'postgres', ''].filter(Boolean)
  
  let connected = false
  let superuserPool = null
  
  for (const password of passwords) {
    try {
      const encodedPassword = password ? encodeURIComponent(password) : ''
      const testUrl = `postgresql://postgres:${encodedPassword}@${host}:${port}/postgres`
      superuserPool = new Pool({ connectionString: testUrl })
      const client = await superuserPool.connect()
      await client.query('SELECT 1')
      client.release()
      connected = true
      console.log('✓ Connected to PostgreSQL as superuser')
      break
    } catch (error) {
      // Try next password
      if (superuserPool) {
        await superuserPool.end()
        superuserPool = null
      }
    }
  }
  
  if (!connected) {
    console.log('⚠ Could not connect as PostgreSQL superuser')
    console.log('  Please create the user manually:')
    console.log('    psql -U postgres')
    console.log('    CREATE USER admin1 WITH PASSWORD \'Admin1@KCC2024!Secure\';')
    console.log('    CREATE DATABASE donna_ai OWNER admin1;')
    console.log('    GRANT ALL PRIVILEGES ON DATABASE donna_ai TO admin1;')
    return false
  }
  
  try {
    const client = await superuserPool.connect()
    
    // Create user (ignore if already exists)
    try {
      await client.query("CREATE USER admin1 WITH PASSWORD 'Admin1@KCC2024!Secure';")
      console.log('✓ Created PostgreSQL user: admin1')
    } catch (error) {
      if (error.code === '42710') {
        console.log('✓ PostgreSQL user admin1 already exists')
      } else {
        throw error
      }
    }
    
    // Create database (ignore if already exists)
    try {
      await client.query('CREATE DATABASE donna_ai OWNER admin1;')
      console.log('✓ Created database: donna_ai')
    } catch (error) {
      if (error.code === '42P04') {
        console.log('✓ Database donna_ai already exists')
      } else {
        throw error
      }
    }
    
    // Grant privileges
    try {
      await client.query('GRANT ALL PRIVILEGES ON DATABASE donna_ai TO admin1;')
      console.log('✓ Granted privileges to admin1')
    } catch (error) {
      // Ignore errors - database might already be set up
    }
    
    client.release()
    await superuserPool.end()
    superuserPool = null // Mark as ended
    
    // Connect to donna_ai database to install pgvector extension
    const dbUrl = process.env.DATABASE_URL || 'postgresql://admin1:Admin1%40KCC2024%21Secure@localhost:5432/donna_ai'
    const urlMatch = dbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/)
    const host = urlMatch ? urlMatch[3] : 'localhost'
    const port = urlMatch ? urlMatch[4] : '5432'
    
    // Connect as postgres superuser to donna_ai database
    const postgresPassword = process.env.POSTGRES_PASSWORD || 'postgres'
    const superuserUrl = `postgresql://postgres:${encodeURIComponent(postgresPassword)}@${host}:${port}/donna_ai`
    const donnaPool = new Pool({ connectionString: superuserUrl })
    
    try {
      const donnaClient = await donnaPool.connect()
      
      // Try to install pgvector extension (non-fatal - migration script handles fallback)
      try {
        await donnaClient.query('CREATE EXTENSION IF NOT EXISTS vector;')
        console.log('✓ Installed pgvector extension')
      } catch (error) {
        console.log('⚠ pgvector extension not available:', error.message)
        console.log('  The migration script will use TEXT for embeddings instead')
        console.log('  Install pgvector later for full AI features:')
        console.log('    Windows: Download DLL from https://github.com/pgvector/pgvector/releases')
        console.log('    macOS: brew install pgvector')
        console.log('    Linux: apt-get install postgresql-XX-pgvector')
        // Don't throw - continue anyway
      }
      
      donnaClient.release()
      await donnaPool.end()
      return true
    } catch (error) {
      // Only end pool if it hasn't been ended yet
      if (donnaPool) {
        try {
          await donnaPool.end()
        } catch {
          // Ignore errors ending pool
        }
      }
      // If connection fails, that's okay - migration script will handle it
      console.log('⚠ Could not connect to donna_ai database for pgvector installation')
      console.log('  Migration script will handle pgvector setup')
      return true
    }
  } catch (error) {
    console.error('❌ Error creating PostgreSQL user/database:', error.message)
    // Only end pool if it hasn't been ended yet
    if (superuserPool) {
      try {
        await superuserPool.end()
      } catch {
        // Ignore errors ending pool
      }
    }
    return false
  }
}

createDbUser().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

