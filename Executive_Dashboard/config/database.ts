import { Pool } from 'pg'

let pool: Pool | null = null

export function getDatabasePool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    pool = new Pool({
      connectionString,
      max: 20,
      min: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  return pool
}

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

