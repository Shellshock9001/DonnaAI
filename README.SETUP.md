# Setup Guide - Donna AI Executive Dashboard

## What Gets Created?

When you run the setup scripts, here's what happens:

### 1. **Dependencies Installation** (`npm install`)
- Installs all Node.js packages
- No database needed yet

### 2. **Database Schema Creation** (`npm run db:migrate`)
- **This is NOT migrating existing data!**
- Creates the **initial database structure**:
  - All tables (users, companies, deals, documents, etc.)
  - Indexes for performance
  - pgvector extension for AI features
  - Foreign key relationships
- **First time setup only** - safe to run multiple times

### 3. **Initial Admin Account** (`npm run db:seed`)
- Creates default company: "KCC Capital Partners"
- Creates one admin account: `admin@kcccapital.com` / `password123`
- **Safe to run multiple times** (won't duplicate)

### 4. **Team Accounts** (`npm run db:create-accounts`)
- Creates 6 team accounts:
  - 2 Admin accounts
  - 2 Manager accounts  
  - 2 User accounts
- **Safe to run multiple times** (skips existing accounts)

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Windows
.\setup.ps1

# Unix/Linux/macOS
chmod +x setup.sh
./setup.sh
```

The script will:
1. ✅ Check prerequisites (Node.js, npm)
2. ✅ Create `.env` file if missing
3. ✅ Install dependencies
4. ✅ Create database schema (if DATABASE_URL is configured)
5. ✅ Create accounts (if database is ready)

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Create database schema (creates all tables)
npm run db:migrate

# 4. Create initial admin account
npm run db:seed

# 5. Create team accounts
npm run db:create-accounts

# 6. Start development server
npm run dev
```

## Understanding "Migrations"

In this project, "migrations" means **creating the initial database structure**, not migrating existing data.

The `migrate.js` script:
- ✅ Creates all tables from scratch
- ✅ Sets up indexes and relationships
- ✅ Installs pgvector extension
- ✅ Safe to run multiple times (uses `IF NOT EXISTS`)

**This is NOT:**
- ❌ Migrating data from another database
- ❌ Updating existing schema
- ❌ Destructive operations

## Database Requirements

Before running migrations, you need:

1. **PostgreSQL 14+** installed and running
2. **pgvector extension** available (included in Docker setup)
3. **DATABASE_URL** configured in `.env`:
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/donna_ai
   ```

## Troubleshooting

### "Database connection failed"
- Make sure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify username/password are correct

### "Extension pgvector does not exist"
- Install pgvector: `CREATE EXTENSION vector;`
- Or use Docker: `docker-compose up postgres`

### "Table already exists"
- This is normal - migrations are idempotent
- Safe to ignore or run again

## What's Next?

After setup:
1. ✅ Start dev server: `npm run dev`
2. ✅ Visit: `http://localhost:3000/login`
3. ✅ Login with: `admin1@kcccapital.com` / `Admin1@KCC2024!Secure`

## Account Credentials

See `accounts.md` for all team account credentials.

**Default Admin (from seed):**
- Email: `admin@kcccapital.com`
- Password: `password123`

**Team Accounts (from create-accounts):**
- Admin: `admin1@kcccapital.com` / `Admin1@KCC2024!Secure`
- Manager: `manager1@kcccapital.com` / `Manager1@KCC2024!`
- User: `user1@kcccapital.com` / `User1@KCC2024!`

