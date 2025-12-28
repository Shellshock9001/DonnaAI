#!/bin/bash
# Docker setup script with security best practices

set -e

echo "🐉 Donna AI - Docker Setup"
echo "=========================="
echo ""

# Check for Docker
if ! command -v docker &> /dev/null; then
    echo "✗ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check for Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "✗ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✓ Docker found"
echo ""

# Generate SSL certificates for development
if [ ! -f "nginx/ssl/cert.pem" ]; then
    echo "Generating self-signed SSL certificates..."
    chmod +x nginx/ssl/generate-self-signed.sh
    ./nginx/ssl/generate-self-signed.sh
    echo "✓ SSL certificates generated"
else
    echo "✓ SSL certificates already exist"
fi

# Create secrets directory for production
if [ ! -d "secrets" ]; then
    echo "Creating secrets directory..."
    mkdir -p secrets
    chmod 700 secrets
    echo "✓ Secrets directory created"
    echo "⚠  For production, create secret files in ./secrets/ directory"
else
    echo "✓ Secrets directory exists"
fi

# Build images
echo ""
echo "Building Docker images..."
docker-compose build

echo ""
echo "=========================="
echo "✓ Docker setup complete!"
echo ""
echo "Next steps:"
echo "  Development: docker-compose -f docker-compose.dev.yml up"
echo "  Production:  docker-compose -f docker-compose.prod.yml up"
echo ""

