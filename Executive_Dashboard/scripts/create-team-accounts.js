require('dotenv').config()
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const accounts = [
  // Admin Accounts
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
  // Manager Accounts (VP role)
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
  // User Accounts (Analyst role)
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

async function createTeamAccounts() {
  const client = await pool.connect()
  
  try {
    await client.query('BEGIN')

    // Get or create default company
    let companyResult = await client.query(
      `SELECT id FROM companies WHERE tenant_id = 'kcc-capital-partners' LIMIT 1`
    )

    let companyId
    if (companyResult.rows.length === 0) {
      const newCompany = await client.query(
        `INSERT INTO companies (name, tenant_id)
         VALUES ('KCC Capital Partners', 'kcc-capital-partners')
         RETURNING id`
      )
      companyId = newCompany.rows[0].id
      console.log('✓ Created default company: KCC Capital Partners')
    } else {
      companyId = companyResult.rows[0].id
      console.log('✓ Using existing company: KCC Capital Partners')
    }

    // Create accounts
    for (const account of accounts) {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
        [account.email]
      )

      if (existingUser.rows.length > 0) {
        console.log(`⚠ User already exists: ${account.email}`)
        continue
      }

      // Hash password
      const passwordHash = await bcrypt.hash(account.password, 10)

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, company_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, email, role`,
        [account.email, passwordHash, account.role, companyId]
      )

      console.log(`✓ Created ${account.role} account: ${account.email} (${account.fullName})`)
    }

    await client.query('COMMIT')
    console.log('\n✅ All team accounts created successfully!')
    console.log('\nAccount Summary:')
    console.log('  - Admin accounts: 2')
    console.log('  - Manager accounts: 2')
    console.log('  - User accounts: 2')
    console.log('  - Total: 6 accounts')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Error creating accounts:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

createTeamAccounts().catch(console.error)

