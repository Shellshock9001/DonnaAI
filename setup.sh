#!/bin/bash
# Donna AI Executive Dashboard - Setup Script (Bash)
# This script sets up the development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo -e "${CYAN}🐉 Donna AI Executive Dashboard - Setup${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# Check for Node.js
echo -e "${YELLOW}Checking prerequisites...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}✗ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/${NC}"
    exit 1
fi

# Check for npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✓ npm found: $NPM_VERSION${NC}"
else
    echo -e "${RED}✗ npm is not installed.${NC}"
    exit 1
fi

# Check for PostgreSQL (optional check)
echo ""
echo -e "${YELLOW}Note: Make sure PostgreSQL is running and DATABASE_URL is set in .env${NC}"

# Check if .env exists and configure it
echo ""
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ .env file not found. Running interactive setup...${NC}"
    echo -e "${CYAN}This will guide you through configuring your environment variables.${NC}"
    echo ""
    npm run setup:env
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠ Interactive setup failed or cancelled. Creating basic .env file...${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://admin1:Admin1%40KCC2024%21Secure@localhost:5432/donna_ai
DIRECT_URL=postgresql://admin1:Admin1%40KCC2024%21Secure@localhost:5432/donna_ai

# JWT
JWT_SECRET=your-secret-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-min-32-chars

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Gemini
GEMINI_API_KEY=your-gemini-api-key

# Perplexity
PERPLEXITY_API_KEY=your-perplexity-api-key

# Tavily
TAVILY_API_KEY=your-tavily-api-key

# Apollo.io
APOLLO_API_KEY=your-apollo-api-key

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
EOF
        fi
        echo -e "${YELLOW}  Please update .env with your actual values before continuing.${NC}"
    else
        echo -e "${GREEN}✓ Environment configured successfully${NC}"
    fi
else
    # Check if .env has placeholder values
    if grep -q "your-secret-key-change-in-production\|your-openai-api-key\|user:password@localhost" .env 2>/dev/null; then
        echo -e "${YELLOW}⚠ .env file exists but contains placeholder values.${NC}"
        echo -e "${CYAN}Would you like to run interactive setup to configure it? (y/n)${NC}"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            npm run setup:env
        fi
    else
        echo -e "${GREEN}✓ .env file exists and appears configured${NC}"
    fi
fi

# Install dependencies
echo ""
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Failed to install dependencies${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Check if database is configured
echo ""
echo -e "${YELLOW}Checking database configuration...${NC}"
if grep -q "postgresql://" .env 2>/dev/null && ! grep -q "postgresql://user:password@localhost" .env 2>/dev/null; then
    echo -e "${GREEN}✓ Database URL configured${NC}"
    
    # Try to create PostgreSQL user and database if they don't exist
    echo ""
    echo -e "${YELLOW}Setting up PostgreSQL user and database...${NC}"
    npm run db:create-user || {
        echo -e "${YELLOW}  Could not create PostgreSQL user automatically.${NC}"
        echo -e "${YELLOW}  Please create manually:${NC}"
        echo -e "${WHITE}    psql -U postgres${NC}"
        echo -e "${WHITE}    CREATE USER admin1 WITH PASSWORD 'Admin1@KCC2024!Secure';${NC}"
        echo -e "${WHITE}    CREATE DATABASE donna_ai OWNER admin1;${NC}"
        echo -e "${WHITE}    GRANT ALL PRIVILEGES ON DATABASE donna_ai TO admin1;${NC}"
    }
    
    # Run database migrations (creates initial schema)
    echo ""
    echo -e "${YELLOW}Creating database schema (initial setup)...${NC}"
    echo -e "${YELLOW}  This will create all tables, indexes, and pgvector extension${NC}"
    npm run db:migrate || {
        echo -e "${YELLOW}⚠ Database schema creation failed.${NC}"
        echo -e "${YELLOW}  Make sure PostgreSQL is running and admin1 user exists.${NC}"
        echo -e "${YELLOW}  You can run 'npm run db:migrate' manually later.${NC}"
    }
    
    # Seed database (creates initial admin account)
    echo ""
    echo -e "${YELLOW}Creating initial admin account...${NC}"
    npm run db:seed || {
        echo -e "${YELLOW}⚠ Initial account creation failed. You can run 'npm run db:seed' manually later.${NC}"
    }
    
    # Create team accounts
    echo ""
    echo -e "${YELLOW}Creating team accounts (admin, manager, user accounts)...${NC}"
    npm run db:create-accounts || {
        echo -e "${YELLOW}⚠ Team accounts creation failed. You can run 'npm run db:create-accounts' manually later.${NC}"
    }
else
    echo -e "${YELLOW}⚠ Database URL not configured or using default values.${NC}"
    echo -e "${YELLOW}  Skipping database setup. Please update DATABASE_URL in .env and run:${NC}"
    echo -e "${WHITE}    npm run db:migrate          # Create database schema${NC}"
    echo -e "${WHITE}    npm run db:seed            # Create initial admin account${NC}"
    echo -e "${WHITE}    npm run db:create-accounts # Create team accounts${NC}"
fi

# Play completion sound
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo ""
echo -e "${CYAN}Next steps:${NC}"
echo -e "${WHITE}  1. Update .env with your API keys and database credentials${NC}"
echo -e "${WHITE}  2. Run 'npm run dev' to start the development server${NC}"
echo -e "${WHITE}  3. Open http://localhost:3000 in your browser${NC}"
echo ""

# Play sound file
# Get script directory and change to it (for relative path)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
# Use relative path from script directory
SOUND_PATH="sounds/setup_complete.wav"

if [ -f "$SOUND_PATH" ]; then
    # Detect OS and try appropriate audio player
    PLAYED=false
    
    # Check for Windows (Git Bash, WSL, Cygwin, MSYS)
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == *"win"* ]] || [[ -n "$WINDIR" ]]; then
        # Windows - use PowerShell with relative path
        # Convert script directory to Windows path format for PowerShell
        PS_SCRIPT_DIR="${SCRIPT_DIR//\//\\}"
        
        # Use PowerShell SoundPlayer - create temp script to avoid escaping issues
        TEMP_PS_SCRIPT=$(mktemp /tmp/play_sound_XXXXXX.ps1 2>/dev/null || echo "/tmp/play_sound_$$.ps1")
        # Use relative path - change to script directory first, then use relative path
        # Write PowerShell script to temp file
        {
            echo "Set-Location '$PS_SCRIPT_DIR'"
            echo "\$player = [System.Media.SoundPlayer]::new('sounds\\setup_complete.wav')"
            echo "\$player.Load()"
            echo "\$player.PlaySync()"
        } > "$TEMP_PS_SCRIPT"
        # Execute the PowerShell script
        if powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$TEMP_PS_SCRIPT" 2>/dev/null; then
            PLAYED=true
            echo -e "${GREEN}🔊 Played completion sound${NC}"
        else
            # If PowerShell fails, try system beep
            cmd.exe /c "rundll32 user32.dll,MessageBeep" 2>/dev/null
            echo -e "${YELLOW}⚠ Could not play sound file, played system beep instead${NC}"
        fi
        # Clean up temp file
        rm -f "$TEMP_PS_SCRIPT" 2>/dev/null
    # macOS
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v afplay &> /dev/null; then
            afplay "$SOUND_PATH" &
            PLAYED=true
            echo -e "${GREEN}🔊 Played completion sound${NC}"
        fi
    # Linux
    elif [[ "$OSTYPE" == "linux-gnu"* ]] || [[ "$OSTYPE" == "linux"* ]]; then
        if command -v aplay &> /dev/null; then
            aplay "$SOUND_PATH" &
            PLAYED=true
            echo -e "${GREEN}🔊 Played completion sound${NC}"
        elif command -v paplay &> /dev/null; then
            paplay "$SOUND_PATH" &
            PLAYED=true
            echo -e "${GREEN}🔊 Played completion sound${NC}"
        fi
    fi
    
    # If no sound player found, show helpful message
    if [ "$PLAYED" = false ]; then
        echo -e "${YELLOW}⚠ Could not play sound (no audio player found for this OS)${NC}"
        echo -e "${YELLOW}  OS detected: ${OSTYPE:-unknown}${NC}"
        echo -e "${YELLOW}  Sound file exists at: $SOUND_PATH${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Sound file not found: $SOUND_PATH${NC}"
    echo -e "${YELLOW}  Creating sounds directory for future use...${NC}"
    mkdir -p sounds
    echo -e "${GREEN}  ✓ Created sounds directory${NC}"
    echo -e "${YELLOW}  Place setup_complete.wav in the sounds directory to enable completion sound${NC}"
fi

echo ""
echo -e "${GREEN}Setup script completed successfully! 🎉${NC}"

