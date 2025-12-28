# Docker setup script for PowerShell

Write-Host "🐉 Donna AI - Docker Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check for Docker
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check for Docker Compose
try {
    $composeVersion = docker-compose --version
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    try {
        $composeVersion = docker compose version
        Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
    } catch {
        Write-Host "✗ Docker Compose is not installed." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Generate SSL certificates for development
if (-Not (Test-Path "nginx\ssl\cert.pem")) {
    Write-Host "Generating self-signed SSL certificates..." -ForegroundColor Yellow
    if (-Not (Test-Path "nginx\ssl")) {
        New-Item -ItemType Directory -Path "nginx\ssl" | Out-Null
    }
    
    # Generate self-signed certificate
    $cert = New-SelfSignedCertificate -DnsName "localhost" -CertStoreLocation "cert:\LocalMachine\My" -NotAfter (Get-Date).AddYears(1)
    Export-Certificate -Cert $cert -FilePath "nginx\ssl\cert.pem" -Type CERT | Out-Null
    
    # Export private key (requires OpenSSL or similar)
    Write-Host "⚠  Please generate key.pem manually or use OpenSSL:" -ForegroundColor Yellow
    Write-Host "   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx\ssl\key.pem -out nginx\ssl\cert.pem" -ForegroundColor Yellow
} else {
    Write-Host "✓ SSL certificates already exist" -ForegroundColor Green
}

# Create secrets directory for production
if (-Not (Test-Path "secrets")) {
    Write-Host "Creating secrets directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "secrets" | Out-Null
    Write-Host "✓ Secrets directory created" -ForegroundColor Green
    Write-Host "⚠  For production, create secret files in .\secrets\ directory" -ForegroundColor Yellow
} else {
    Write-Host "✓ Secrets directory exists" -ForegroundColor Green
}

# Build images
Write-Host ""
Write-Host "Building Docker images..." -ForegroundColor Yellow
docker-compose build

Write-Host ""
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "✓ Docker setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  Development: docker-compose -f docker-compose.dev.yml up" -ForegroundColor White
Write-Host "  Production:  docker-compose -f docker-compose.prod.yml up" -ForegroundColor White
Write-Host ""

