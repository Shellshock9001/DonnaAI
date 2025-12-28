# Docker Deployment Guide

## Quick Start

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Or use the setup script
chmod +x scripts/docker-setup.sh
./scripts/docker-setup.sh
docker-compose -f docker-compose.dev.yml up
```

### Production

```bash
# 1. Create secrets directory
mkdir -p secrets
chmod 700 secrets

# 2. Create secret files (one value per file)
echo "your-db-user" > secrets/postgres_user.txt
echo "your-strong-password" > secrets/postgres_password.txt
echo "donna_ai" > secrets/postgres_db.txt
echo "your-jwt-secret-min-32-chars" > secrets/jwt_secret.txt
echo "your-refresh-secret-min-32-chars" > secrets/jwt_refresh_secret.txt
# ... add all other secrets

# 3. Generate SSL certificates (or use Let's Encrypt)
chmod +x nginx/ssl/generate-self-signed.sh
./nginx/ssl/generate-self-signed.sh

# 4. Start production stack
docker-compose -f docker-compose.prod.yml up -d
```

## Security Features

### 1. **Non-Root Containers**
- All containers run as non-root users
- Reduced attack surface

### 2. **Read-Only Filesystems**
- Containers use read-only root filesystems
- Temporary filesystems for writable directories

### 3. **No New Privileges**
- `security_opt: no-new-privileges:true` prevents privilege escalation

### 4. **Network Isolation**
- Services communicate through isolated Docker network
- Only necessary ports exposed

### 5. **Secrets Management**
- Production uses Docker secrets (not environment variables)
- Secrets stored in files, not in image layers

### 6. **SSL/TLS Encryption**
- Nginx reverse proxy with SSL termination
- TLS 1.2+ only
- Strong cipher suites

### 7. **Rate Limiting**
- API endpoints: 10 requests/second
- Auth endpoints: 5 requests/minute
- Prevents brute force attacks

### 8. **Security Headers**
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection
- Strict-Transport-Security
- Content-Security-Policy ready

### 9. **Health Checks**
- All services have health checks
- Automatic restart on failure

### 10. **Resource Limits**
- CPU and memory limits per service
- Prevents resource exhaustion attacks

## Architecture

```
┌─────────────┐
│   Nginx     │ ← SSL/TLS Termination, Rate Limiting
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
┌──────▼──────┐
│   Next.js   │ ← Application
│     App     │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌──▼──┐
│Postgres│ │MinIO│
│(pgvector)│ │(S3)│
└─────┘ └────┘
```

## Environment Variables

### Development
Use `.env` file (gitignored)

### Production
Use Docker secrets (files in `./secrets/` directory)

## SSL Certificates

### Development
Self-signed certificates (generated automatically)

### Production
1. **Let's Encrypt** (recommended):
```bash
# Use certbot with nginx
certbot --nginx -d your-domain.com
```

2. **Custom CA**:
Replace files in `nginx/ssl/`:
- `cert.pem` - Certificate
- `key.pem` - Private key

## Monitoring

### Health Checks
```bash
# Check all services
docker-compose ps

# Check specific service
docker-compose exec app node -e "require('http').get('http://localhost:3000/api/health', (r) => {console.log(r.statusCode)})"
```

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
```

## Backup & Restore

### Database Backup
```bash
docker-compose exec postgres pg_dump -U donna_user donna_ai > backup.sql
```

### Database Restore
```bash
docker-compose exec -T postgres psql -U donna_user donna_ai < backup.sql
```

### MinIO Backup
```bash
# MinIO data is in volume: minio_data
docker run --rm -v donna-minio_data:/data -v $(pwd):/backup alpine tar czf /backup/minio-backup.tar.gz /data
```

## Troubleshooting

### Container won't start
```bash
# Check logs
docker-compose logs app

# Check health
docker-compose ps
```

### Database connection issues
```bash
# Verify PostgreSQL is running
docker-compose exec postgres pg_isready

# Check connection string
docker-compose exec app env | grep DATABASE_URL
```

### SSL certificate issues
```bash
# Regenerate self-signed cert
./nginx/ssl/generate-self-signed.sh

# Restart nginx
docker-compose restart nginx
```

## Production Checklist

- [ ] Replace self-signed SSL certificates with Let's Encrypt
- [ ] Update all secrets in `./secrets/` directory
- [ ] Set strong passwords (min 32 characters)
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review and update security headers
- [ ] Enable log aggregation
- [ ] Set up CI/CD pipeline
- [ ] Configure auto-scaling (if needed)

## Security Best Practices

1. **Never commit secrets** - Use Docker secrets
2. **Regular updates** - Keep images updated
3. **Monitor logs** - Set up log aggregation
4. **Backup regularly** - Automated backups
5. **Limit exposure** - Only expose necessary ports
6. **Use HTTPS** - Always use SSL/TLS
7. **Rate limiting** - Already configured in nginx
8. **Keep images minimal** - Using Alpine Linux
9. **Scan images** - Use Docker security scanning
10. **Network policies** - Use Docker network isolation

