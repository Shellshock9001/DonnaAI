# Donna AI Executive Dashboard - Setup Script (PowerShell)
# This script sets up the development environment

# Store script directory at the very beginning - CRITICAL for finding sound file
# This MUST be at the top before any other code runs
# Find the actual setup.ps1 file location - works even if script is executed from temp
$SCRIPT_DIR = $null

# Method 1: Try to find setup.ps1 in current directory
$scriptFile = Get-Item "setup.ps1" -ErrorAction SilentlyContinue
if ($scriptFile) {
    $SCRIPT_DIR = $scriptFile.DirectoryName
}

# Method 2: If not found, try PSScriptRoot (when script is dot-sourced)
if (-not $SCRIPT_DIR -and $PSScriptRoot) {
    $testPath = Join-Path $PSScriptRoot "setup.ps1"
    if (Test-Path $testPath) {
        $SCRIPT_DIR = $PSScriptRoot
    }
}

# Method 3: Try MyInvocation paths
if (-not $SCRIPT_DIR) {
    $invocationPath = $null
    if ($MyInvocation.MyCommand.Path) {
        $invocationPath = $MyInvocation.MyCommand.Path
    } elseif ($MyInvocation.PSCommandPath) {
        $invocationPath = $MyInvocation.PSCommandPath
    } elseif ($PSCommandPath) {
        $invocationPath = $PSCommandPath
    }
    
    if ($invocationPath) {
        # Check if this is actually setup.ps1 (not a temp copy)
        $invocationFile = Get-Item $invocationPath -ErrorAction SilentlyContinue
        if ($invocationFile -and $invocationFile.Name -eq "setup.ps1") {
            $SCRIPT_DIR = $invocationFile.DirectoryName
        }
    }
}

# Method 4: Last resort - use current directory
if (-not $SCRIPT_DIR) {
    $SCRIPT_DIR = $PWD.Path
}

Write-Host "🐉 Donna AI Executive Dashboard - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check for npm
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed." -ForegroundColor Red
    exit 1
}

# Check for PostgreSQL (optional check)
Write-Host ""
Write-Host "Note: Make sure PostgreSQL is running and DATABASE_URL is set in .env" -ForegroundColor Yellow

# Check if .env exists and configure it
Write-Host ""
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "⚠ .env file not found. Running interactive setup..." -ForegroundColor Yellow
    Write-Host "This will guide you through configuring your environment variables." -ForegroundColor Cyan
    Write-Host ""
    npm run setup:env
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Interactive setup failed or cancelled. Creating basic .env file..." -ForegroundColor Yellow
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
        } else {
            @"
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
"@ | Out-File -FilePath ".env" -Encoding utf8
        }
        Write-Host "  Please update .env with your actual values before continuing." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Environment configured successfully" -ForegroundColor Green
    }
} else {
    # Check if .env has placeholder values
    $envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
    if ($envContent -match "your-secret-key-change-in-production|your-openai-api-key|user:password@localhost") {
        Write-Host "⚠ .env file exists but contains placeholder values." -ForegroundColor Yellow
        $response = Read-Host "Would you like to run interactive setup to configure it? (y/n)"
        if ($response -eq "y" -or $response -eq "Y") {
            npm run setup:env
        }
    } else {
        Write-Host "✓ .env file exists and appears configured" -ForegroundColor Green
    }
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Check if database is configured
Write-Host ""
Write-Host "Checking database configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env -ErrorAction SilentlyContinue
if ($envContent -match "postgresql://" -and $envContent -notmatch "postgresql://user:password@localhost") {
    Write-Host "✓ Database URL configured" -ForegroundColor Green
    
    # Try to create PostgreSQL user and database if they don't exist
    Write-Host ""
    Write-Host "Setting up PostgreSQL user and database..." -ForegroundColor Yellow
    npm run db:create-user
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  Could not create PostgreSQL user automatically." -ForegroundColor Yellow
        Write-Host "  Please create manually:" -ForegroundColor Yellow
        Write-Host "    psql -U postgres" -ForegroundColor White
        Write-Host "    CREATE USER admin1 WITH PASSWORD 'Admin1@KCC2024!Secure';" -ForegroundColor White
        Write-Host "    CREATE DATABASE donna_ai OWNER admin1;" -ForegroundColor White
        Write-Host "    GRANT ALL PRIVILEGES ON DATABASE donna_ai TO admin1;" -ForegroundColor White
    }
    
    # Run database migrations (creates initial schema)
    Write-Host ""
    Write-Host "Creating database schema (initial setup)..." -ForegroundColor Yellow
    Write-Host "  This will create all tables, indexes, and pgvector extension" -ForegroundColor Yellow
    npm run db:migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Database schema creation failed." -ForegroundColor Yellow
        Write-Host "  Make sure PostgreSQL is running and admin1 user exists." -ForegroundColor Yellow
        Write-Host "  You can run 'npm run db:migrate' manually later." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Database schema created" -ForegroundColor Green
    }
    
    # Seed database (creates initial admin account)
    Write-Host ""
    Write-Host "Creating initial admin account..." -ForegroundColor Yellow
    npm run db:seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Initial account creation failed. You can run 'npm run db:seed' manually later." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Initial admin account created" -ForegroundColor Green
    }
    
    # Create team accounts
    Write-Host ""
    Write-Host "Creating team accounts (admin, manager, user accounts)..." -ForegroundColor Yellow
    npm run db:create-accounts
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠ Team accounts creation failed. You can run 'npm run db:create-accounts' manually later." -ForegroundColor Yellow
    } else {
        Write-Host "✓ Team accounts created" -ForegroundColor Green
    }
} else {
    Write-Host "⚠ Database URL not configured or using default values." -ForegroundColor Yellow
    Write-Host "  Skipping database setup. Please update DATABASE_URL in .env and run:" -ForegroundColor Yellow
    Write-Host "    npm run db:migrate          # Create database schema" -ForegroundColor White
    Write-Host "    npm run db:seed            # Create initial admin account" -ForegroundColor White
    Write-Host "    npm run db:create-accounts # Create team accounts" -ForegroundColor White
}

# Play completion sound
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Update .env with your API keys and database credentials" -ForegroundColor White
Write-Host "  2. Run 'npm run dev' to start the development server" -ForegroundColor White
Write-Host "  3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""

# Play sound file
# Use relative path - change to script directory first
Push-Location $SCRIPT_DIR
$soundPath = "sounds\setup_complete.wav"

# Try to play the sound
if (Test-Path $soundPath) {
    try {
        # Use relative path - we're already in the script directory
        $soundPlayer = New-Object System.Media.SoundPlayer $soundPath
        
        # Load the sound file synchronously first (ensures file is ready)
        $soundPlayer.Load()
        
        # Play synchronously - blocks until sound finishes playing
        # This is the key - PlaySync() ensures the sound actually plays!
        $soundPlayer.PlaySync()
        
        Write-Host "🔊 Played completion sound" -ForegroundColor Green
    } catch {
        $errorMsg = $_.Exception.Message
        Write-Host "⚠ Could not play sound file" -ForegroundColor Yellow
        Write-Host "  Path: $soundPath" -ForegroundColor Yellow
        Write-Host "  Error: $errorMsg" -ForegroundColor Yellow
        
        # Fallback: Try system beep
        try {
            [console]::beep(800, 500)
            Write-Host "  Played system beep instead" -ForegroundColor Yellow
        } catch {
            # Silent failure
        }
    }
} else {
    Write-Host "⚠ Sound file not found: $soundPath" -ForegroundColor Yellow
    Write-Host "  Creating sounds directory for future use..." -ForegroundColor Yellow
    $soundsDir = "sounds"
    if (-Not (Test-Path $soundsDir)) {
        New-Item -ItemType Directory -Path $soundsDir -Force | Out-Null
        Write-Host "  ✓ Created sounds directory" -ForegroundColor Green
        Write-Host "  Place setup_complete.wav in the sounds directory to enable completion sound" -ForegroundColor Yellow
    }
}
# Restore original location
Pop-Location

Write-Host ""
Write-Host "Setup script completed successfully! 🎉" -ForegroundColor Green

