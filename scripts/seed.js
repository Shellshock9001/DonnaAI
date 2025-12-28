require('dotenv').config()
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function seed() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Create a test company
    const companyResult = await client.query(`
      INSERT INTO companies (name, tenant_id)
      VALUES ('KCC Capital Partners', 'kcc-capital-partners')
      ON CONFLICT (tenant_id) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `)
    const companyId = companyResult.rows[0].id

    // Create a test user
    const passwordHash = await bcrypt.hash('password123', 10)
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, role, company_id)
      VALUES ('admin@kcccapital.com', $1, 'admin', $2)
      ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
      RETURNING id
    `, [passwordHash, companyId])
    const userId = userResult.rows[0].id

    console.log('Seed data created successfully')
    console.log('Company ID:', companyId)
    console.log('User ID:', userId)
    console.log('Email: admin@kcccapital.com')
    console.log('Password: password123')
    console.log('\n💡 Tip: Run "npm run db:create-accounts" to create all team accounts')

    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seed().catch(console.error)

