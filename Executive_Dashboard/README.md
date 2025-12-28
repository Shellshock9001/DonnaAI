# Donna AI Executive Dashboard

Enterprise M&A workflow platform with AI-powered intelligence for KCC Capital Partners.

## Features

- Executive Dashboard with real-time KPIs
- Deal Management & Pipeline Tracking
- Virtual Data Room with Document Intelligence
- AI Search with Grounded RAG
- Network Intelligence with GNN Matching
- Compliance & Audit Logging (FINRA 4511)
- ML Ops & Performance Monitoring
- Time Tracking & ROI Analytics

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL, pgvector
- **AI**: OpenAI GPT-4, Gemini 2.0 Flash, Perplexity
- **State**: React Query, Zustand
- **Storage**: MinIO (S3-compatible)
- **Real-time**: WebSocket

## Getting Started

### Quick Setup (Recommended)

**Windows (PowerShell):**
```powershell
.\setup.ps1
```

**Unix/Linux/macOS (Bash):**
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
- ✅ Check prerequisites (Node.js, npm)
- ✅ Install dependencies
- ✅ Create `.env` from `.env.example`
- ✅ Create database schema (tables, indexes) - **if DATABASE_URL is configured**
- ✅ Create initial admin account - **if database is ready**
- ✅ Create team accounts - **if database is ready**
- ✅ Play completion sound

**Note:** Database setup only runs if `DATABASE_URL` is properly configured in `.env`. See [Setup Guide](README.SETUP.md) for details.

### Configure Environment Variables

**Interactive Setup (Recommended):**
```bash
npm run setup:env
```

**Or manually edit `.env`:**
```bash
# Copy example file
cp .env.example .env

# Edit .env with your values
# Required: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
# Optional: API keys for AI features
```

See [Environment Setup Guide](docs/ENV_SETUP.md) for detailed instructions.

### Manual Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
npm run db:migrate
```

4. Seed database (optional):
```bash
npm run db:seed
```

5. Start development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── app/                 # Next.js app router
├── features/           # Feature modules
├── shared/             # Shared utilities & components
└── config/             # Configuration files
```

## License

Proprietary - KCC Capital Partners

