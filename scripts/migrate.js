require('dotenv').config()
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function runMigrations() {
  console.log('🗄️  Setting up database structure...')
  console.log('   Creating empty tables, indexes, and extensions.')
  console.log('   This is NOT migrating data - just creating the database structure.')
  console.log('')
  
  const client = await pool.connect()
  
  // Check if pgvector extension exists BEFORE starting transaction
  let hasVectorExtension = false
  try {
    const extCheck = await client.query("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'vector')")
    hasVectorExtension = extCheck.rows[0].exists
    if (!hasVectorExtension) {
      try {
        await client.query('CREATE EXTENSION vector')
        hasVectorExtension = true
        console.log('✓ Created pgvector extension')
      } catch (error) {
        console.log('⚠ pgvector extension not available - will use TEXT for embeddings')
        console.log('  Install pgvector later for full AI features')
        hasVectorExtension = false
      }
    } else {
      console.log('✓ pgvector extension verified')
    }
  } catch (error) {
    console.log('⚠ pgvector extension not available - will use TEXT for embeddings')
    hasVectorExtension = false
  }

  // Determine embedding column type based on pgvector availability
  const embeddingType = hasVectorExtension ? 'vector(1536)' : 'TEXT'

  // Now start transaction and create all tables
  try {
    await client.query('BEGIN')

    // Create companies table
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        tenant_id VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'analyst',
        company_id UUID NOT NULL REFERENCES companies(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // Create deals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        stage VARCHAR(100) NOT NULL,
        value DECIMAL(15, 2),
        currency VARCHAR(10) DEFAULT 'USD',
        sector VARCHAR(100),
        health_score FLOAT,
        company_id UUID NOT NULL REFERENCES companies(id),
        created_by_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // Create deal_activities table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deal_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create documents table
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_hash VARCHAR(64) NOT NULL,
        status VARCHAR(50) DEFAULT 'uploaded',
        deal_id UUID REFERENCES deals(id),
        company_id UUID NOT NULL REFERENCES companies(id),
        uploaded_by_id UUID NOT NULL REFERENCES users(id),
        storage_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // Create document_chunks table with vector support
    await client.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        page_number INTEGER,
        chunk_index INTEGER NOT NULL,
        embedding ${embeddingType},
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create network_members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS network_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        company VARCHAR(255),
        role VARCHAR(100),
        location VARCHAR(255),
        sectors TEXT[] DEFAULT '{}',
        tags TEXT[] DEFAULT '{}',
        trust_score FLOAT,
        company_id UUID NOT NULL REFERENCES companies(id),
        created_by_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        deleted_at TIMESTAMP WITH TIME ZONE
      )
    `)

    // Create network_edges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS network_edges (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        from_member_id UUID NOT NULL REFERENCES network_members(id),
        to_member_id UUID NOT NULL REFERENCES network_members(id),
        relationship VARCHAR(100) NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create network_outcomes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS network_outcomes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        member_id UUID NOT NULL REFERENCES network_members(id) ON DELETE CASCADE,
        type VARCHAR(100) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        description TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create company_intelligence table
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_intelligence (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE,
        data JSONB NOT NULL,
        freshness_score FLOAT DEFAULT 0,
        source_quality FLOAT DEFAULT 0,
        synergy_potential JSONB,
        embedding ${embeddingType},
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create audit_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(100),
        resource_id UUID,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        previous_hash VARCHAR(64),
        hash VARCHAR(64) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create ai_audits table
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_audits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operation_type VARCHAR(100) NOT NULL,
        model VARCHAR(100),
        input_tokens INTEGER,
        output_tokens INTEGER,
        cost_usd DECIMAL(10, 6),
        latency_ms INTEGER,
        confidence_score FLOAT,
        grounding_score FLOAT,
        bias_flags TEXT[] DEFAULT '{}',
        trace_id VARCHAR(255),
        span_id VARCHAR(255),
        metadata JSONB,
        human_review BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create time_tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS time_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        operation_type VARCHAR(100) NOT NULL,
        time_saved INTEGER NOT NULL,
        user_id UUID,
        deal_id UUID,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `)

    // Create ai_settings table (per company, encrypted API keys with validation status)
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        openai_api_key_encrypted TEXT,
        gemini_api_key_encrypted TEXT,
        perplexity_api_key_encrypted TEXT,
        tavily_api_key_encrypted TEXT,
        apollo_api_key_encrypted TEXT,
        openai_validated BOOLEAN DEFAULT FALSE,
        gemini_validated BOOLEAN DEFAULT FALSE,
        perplexity_validated BOOLEAN DEFAULT FALSE,
        tavily_validated BOOLEAN DEFAULT FALSE,
        apollo_validated BOOLEAN DEFAULT FALSE,
        default_model VARCHAR(100) DEFAULT 'gpt-4-turbo',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(company_id)
      )
    `)

    // Add validation columns if they don't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_settings' AND column_name='openai_validated') THEN
          ALTER TABLE ai_settings ADD COLUMN openai_validated BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_settings' AND column_name='gemini_validated') THEN
          ALTER TABLE ai_settings ADD COLUMN gemini_validated BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_settings' AND column_name='perplexity_validated') THEN
          ALTER TABLE ai_settings ADD COLUMN perplexity_validated BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_settings' AND column_name='tavily_validated') THEN
          ALTER TABLE ai_settings ADD COLUMN tavily_validated BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='ai_settings' AND column_name='apollo_validated') THEN
          ALTER TABLE ai_settings ADD COLUMN apollo_validated BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `)

    await client.query('CREATE INDEX IF NOT EXISTS idx_ai_settings_company_id ON ai_settings(company_id)')

    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_deals_company_id ON deals(company_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_deal_id ON documents(deal_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_document_chunks_document_id ON document_chunks(document_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_network_members_company_id ON network_members(company_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_network_edges_from_member_id ON network_edges(from_member_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_network_edges_to_member_id ON network_edges(to_member_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_ai_audits_operation_type ON ai_audits(operation_type)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_ai_audits_created_at ON ai_audits(created_at)')

    // Create vector indexes for embeddings (only if pgvector is available)
    if (hasVectorExtension) {
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
          ON document_chunks 
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
        `)

        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_company_intelligence_embedding 
          ON company_intelligence 
          USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100)
        `)
        console.log('✓ Created vector indexes')
      } catch (error) {
        console.log('⚠ Could not create vector indexes (pgvector not available)')
      }
    }

    await client.query('COMMIT')
    console.log('')
    console.log('✅ Database schema created successfully!')
    console.log('   All tables, indexes, and pgvector extension are ready.')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Migration failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations().catch(console.error)

