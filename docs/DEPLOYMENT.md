# Production Deployment Guide

## Prerequisites

1. A server with:
   - Docker and Docker Compose installed
   - Ports 80 and 443 open
   - A domain name pointing to your server IP

2. DNS Configuration:
   - Create an A record for `crs.shaily.dev` pointing to your server's IP address

## Quick Start

1. **Clone the repository** on your production server:
   ```bash
   git clone <your-repo-url> credit_risk_system
   cd credit_risk_system
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.production .env
   ```
   Edit `.env` and set:
   - `POSTGRES_PASSWORD`: Strong database password
   - `REDIS_PASSWORD`: Strong Redis password
   - `SECRET_KEY`: Will be auto-generated if left default
   - `EMAIL`: Your email for Let's Encrypt notifications
   - `DOMAIN`: Your domain (default: crs.shaily.dev)

3. **Run the deployment script**:
   ```bash
   ./deploy-production.sh
   ```

   This script will:
   - Check dependencies
   - Generate secure secrets
   - Obtain SSL certificates from Let's Encrypt
   - Build and start all services
   - Set up automatic SSL renewal
   - Optionally create an admin user

## Manual Deployment Steps

If you prefer manual deployment:

### 1. SSL Certificate Setup

```bash
# Create directories
mkdir -p certbot/conf certbot/www

# Start nginx for ACME challenge
docker-compose -f docker-compose.production.yml up -d nginx

# Get initial certificate
docker run --rm \
  -v $(pwd)/certbot/conf:/etc/letsencrypt \
  -v $(pwd)/certbot/www:/var/www/certbot \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@shaily.dev \
  --agree-tos \
  --no-eff-email \
  -d crs.shaily.dev
```

### 2. Build and Deploy

```bash
# Build images
docker-compose -f docker-compose.production.yml build

# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps
```

### 3. Set up Auto-renewal

Add to crontab:
```bash
0 0,12 * * * cd /path/to/project && docker-compose -f docker-compose.production.yml run --rm certbot renew && docker-compose -f docker-compose.production.yml exec nginx nginx -s reload
```

## Management Commands

- **View logs**: `docker-compose -f docker-compose.production.yml logs -f [service]`
- **Restart services**: `docker-compose -f docker-compose.production.yml restart`
- **Stop services**: `docker-compose -f docker-compose.production.yml down`
- **Update deployment**: `git pull && ./deploy-production.sh update`
- **Check SSL renewal**: `./deploy-production.sh ssl`

## Security Considerations

1. **Firewall**: Only expose ports 80 and 443
2. **Updates**: Regularly update Docker images and dependencies
3. **Backups**: Set up regular database backups
4. **Monitoring**: Enable monitoring with Prometheus/Grafana (optional)

## Troubleshooting

### SSL Certificate Issues
- Ensure domain DNS is properly configured
- Check firewall allows ports 80/443
- Verify certbot logs: `docker logs crs-certbot`

### Service Health
- Check backend: `curl https://crs.shaily.dev/health`
- View logs: `docker-compose -f docker-compose.production.yml logs backend`

### Database Connection
- Verify PostgreSQL is running: `docker ps | grep postgres`
- Check connection: `docker exec -it crs-postgres psql -U creditrisk -d creditrisk_db`

## Monitoring (Optional)

Enable monitoring stack:
```bash
docker-compose -f docker-compose.production.yml --profile monitoring up -d
```

Access:
- Prometheus: http://localhost:9090 (internal only)
- Grafana: http://localhost:3001 (internal only)

## Backup Strategy

### Database Backup
```bash
# Backup
docker exec crs-postgres pg_dump -U creditrisk creditrisk_db > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i crs-postgres psql -U creditrisk creditrisk_db < backup.sql
```

### Full System Backup
```bash
# Stop services
docker-compose -f docker-compose.production.yml down

# Backup volumes
tar -czf backup_volumes_$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/credit_risk_system_*

# Restart services
docker-compose -f docker-compose.production.yml up -d
```