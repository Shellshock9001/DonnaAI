# Environment Variables Setup Guide

## Quick Setup

### Option 1: Interactive Setup (Recommended)
```bash
node scripts/setup-env.js
```

This will guide you through configuring all environment variables interactively.

### Option 2: Manual Setup

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values.

## Required Configuration

### 1. Database (REQUIRED)

```env
DATABASE_URL=postgresql://username:password@localhost:5432/donna_ai
DIRECT_URL=postgresql://username:password@localhost:5432/donna_ai
```

**How to get these values:**
- **Username**: Your PostgreSQL username (default: `postgres` or `donna_user`)
- **Password**: Your PostgreSQL password
- **Host**: Database host (default: `localhost`)
- **Port**: Database port (default: `5432`)
- **Database**: Database name (default: `donna_ai`)

**Example:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/donna_ai
```

### 2. JWT Secrets (REQUIRED)

```env
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
```

**Generate secure secrets:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

**Minimum Requirements:**
- At least 32 characters
- Random and unpredictable
- Different for each environment

## Optional Configuration

### 3. AI API Keys (Optional - for AI features)

These are optional but required for AI features to work:

```env
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
PERPLEXITY_API_KEY=...
TAVILY_API_KEY=...
APOLLO_API_KEY=...
```

**Where to get API keys:**
- **OpenAI**: https://platform.openai.com/api-keys
- **Gemini**: https://makersuite.google.com/app/apikey
- **Perplexity**: https://www.perplexity.ai/settings/api
- **Tavily**: https://tavily.com/
- **Apollo.io**: https://www.apollo.io/settings/api-keys

**Note:** You can start the app without these, but AI features won't work.

### 4. MinIO Configuration (Optional - for file storage)

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
```

**Default values work for local development.** Change if using external MinIO/S3.

### 5. App Configuration

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**For production:**
```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

## Environment-Specific Examples

### Local Development
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/donna_ai
JWT_SECRET=dev-secret-change-in-production-min-32-chars-long
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production-min-32-chars
NODE_ENV=development
```

### Docker Development
```env
DATABASE_URL=postgresql://donna_user:changeme@postgres:5432/donna_ai
MINIO_ENDPOINT=minio
MINIO_PORT=9000
```

### Production
```env
DATABASE_URL=postgresql://user:strong-password@db.example.com:5432/donna_ai
JWT_SECRET=<generate-strong-random-64-char-secret>
JWT_REFRESH_SECRET=<generate-strong-random-64-char-secret>
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://app.example.com
```

## Security Best Practices

1. **Never commit `.env` to version control**
   - Already in `.gitignore`
   - Use `.env.example` as template

2. **Use strong secrets in production**
   - Minimum 32 characters
   - Random and unpredictable
   - Different for each environment

3. **Rotate secrets regularly**
   - Change JWT secrets periodically
   - Update API keys if compromised

4. **Use environment-specific values**
   - Different secrets for dev/staging/prod
   - Never use production secrets in development

5. **Protect API keys**
   - Don't share API keys
   - Use environment variables, not code
   - Rotate if exposed

## Verification

After setting up `.env`, verify configuration:

```bash
# Check if .env exists
cat .env

# Test database connection
npm run db:migrate

# Start development server
npm run dev
```

## Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready` or `docker ps`
- Verify DATABASE_URL format is correct
- Check username/password are correct
- Ensure database exists: `createdb donna_ai`

### "JWT_SECRET is too short"
- Generate a longer secret (minimum 32 characters)
- Use the interactive setup script for auto-generation

### "API key invalid"
- Verify API key is correct
- Check API key hasn't expired
- Ensure no extra spaces in .env file

### "Environment variable not found"
- Check `.env` file exists in project root
- Verify variable name matches exactly (case-sensitive)
- Restart dev server after changing .env

## Quick Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | - | PostgreSQL connection string |
| `JWT_SECRET` | ✅ Yes | - | JWT signing secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ Yes | - | Refresh token secret (min 32 chars) |
| `OPENAI_API_KEY` | ❌ No | - | OpenAI API key for AI features |
| `GEMINI_API_KEY` | ❌ No | - | Google Gemini API key |
| `PERPLEXITY_API_KEY` | ❌ No | - | Perplexity API key |
| `TAVILY_API_KEY` | ❌ No | - | Tavily search API key |
| `APOLLO_API_KEY` | ❌ No | - | Apollo.io API key |
| `MINIO_ENDPOINT` | ❌ No | `localhost` | MinIO server endpoint |
| `MINIO_PORT` | ❌ No | `9000` | MinIO server port |
| `MINIO_ACCESS_KEY` | ❌ No | `minioadmin` | MinIO access key |
| `MINIO_SECRET_KEY` | ❌ No | `minioadmin` | MinIO secret key |
| `NEXT_PUBLIC_APP_URL` | ❌ No | `http://localhost:3000` | Public app URL |
| `NODE_ENV` | ❌ No | `development` | Node environment |

