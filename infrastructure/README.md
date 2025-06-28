# Ride-Share Application Infrastructure

This directory contains the complete infrastructure setup for the Ride-Share application, including Docker configurations, monitoring, backup systems, and deployment scripts.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   PostgreSQL    │
│   (React)       │    │   (Node.js)     │    │   Database      │
│   Port: 3001    │    │   Port: 3000    │    │   Port: 5432    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Nginx Proxy   │
                    │   Port: 80/443  │
                    └─────────────────┘
                                 │
                    ┌─────────────────┐
                    │     Redis       │
                    │   Port: 6379    │
                    └─────────────────┘
```

## 📁 Directory Structure

```
infrastructure/
├── docker-compose.dev.yml          # Development environment
├── docker-compose.prod.yml         # Production environment
├── nginx.dev.conf                  # Development Nginx config
├── nginx.prod.conf                 # Production Nginx config
├── env.example                     # Environment variables template
├── deploy.sh                       # Deployment script
├── scripts/
│   ├── backup.sh                   # Database backup script
│   └── init-db.sql                 # Database initialization
├── monitoring/
│   └── prometheus.yml              # Prometheus configuration
├── ssl/                            # SSL certificates (production)
├── backups/                        # Database backups
└── logs/                           # Application logs
```

## 🚀 Quick Start

### Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 2.0+)
- At least 4GB RAM available
- 10GB free disk space

### Development Environment

1. **Clone the repository and navigate to infrastructure:**
   ```bash
   cd infrastructure
   ```

2. **Set up environment variables:**
   ```bash
   cp env.example .env.development
   # Edit .env.development with your configuration
   ```

3. **Deploy the development environment:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh development
   ```

4. **Access the application:**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - Nginx: http://localhost:80

### Production Environment

1. **Set up environment variables:**
   ```bash
   cp env.example .env.production
   # Edit .env.production with production values
   ```

2. **Set up SSL certificates:**
   ```bash
   mkdir -p ssl
   # Place your SSL certificates in ssl/ directory:
   # - ssl/your_cert.crt
   # - ssl/your_key.key
   ```

3. **Deploy the production environment:**
   ```bash
   ./deploy.sh production
   ```

4. **Access the application:**
   - Frontend: https://yourdomain.com
   - Backend API: https://yourdomain.com/api
   - Prometheus: http://localhost:9090
   - Grafana: http://localhost:3002

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```bash
# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=ride_share
DB_HOST=db
DB_PORT=5432

# Backend Configuration
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# AWS Configuration (for backups)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-backup-bucket

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

### SSL Configuration

For production, you need SSL certificates:

1. **Using Let's Encrypt (recommended):**
   ```bash
   # Install certbot
   sudo apt-get install certbot

   # Generate certificates
   sudo certbot certonly --standalone -d yourdomain.com

   # Copy certificates to ssl directory
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/your_cert.crt
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/your_key.key
   ```

2. **Using custom certificates:**
   - Place your certificates in the `ssl/` directory
   - Update the Nginx configuration if needed

## 📊 Monitoring

### Prometheus

Prometheus collects metrics from all services:

- **URL:** http://localhost:9090
- **Configuration:** `monitoring/prometheus.yml`
- **Metrics collected:**
  - Application metrics
  - Database performance
  - System resources
  - Custom business metrics

### Grafana

Grafana provides dashboards for monitoring:

- **URL:** http://localhost:3002
- **Default credentials:** admin/admin
- **Pre-configured dashboards:**
  - Application overview
  - Database performance
  - System resources
  - Custom ride-share metrics

### Health Checks

All services include health check endpoints:

- **Backend:** `GET /health`
- **Frontend:** `GET /`
- **Database:** PostgreSQL connection check
- **Redis:** Redis connection check

## 💾 Backup & Recovery

### Automated Backups

The system includes automated database backups:

1. **Local backups:** Stored in `backups/` directory
2. **S3 backups:** Uploaded to AWS S3 (if configured)
3. **Retention:** 30 days by default

### Manual Backup

```bash
# Create backup
./deploy.sh production backup

# Restore from backup
docker-compose -f docker-compose.prod.yml exec backup /backup.sh --restore backup_filename.sql
```

### Backup Configuration

Configure backup settings in environment variables:

```bash
# Backup retention (days)
RETENTION_DAYS=30

# AWS S3 configuration
AWS_S3_BUCKET=your-backup-bucket
AWS_REGION=us-east-1
```

## 🔒 Security

### Security Features

- **Non-root containers:** All services run as non-root users
- **Network isolation:** Services communicate through Docker networks
- **SSL/TLS:** HTTPS encryption in production
- **Rate limiting:** API rate limiting via Nginx
- **Security headers:** XSS protection, CSRF protection, etc.
- **Input validation:** All inputs are validated and sanitized

### Security Best Practices

1. **Change default passwords** in environment files
2. **Use strong JWT secrets**
3. **Regular security updates** for base images
4. **Monitor logs** for suspicious activity
5. **Regular backups** with encryption
6. **Network segmentation** in production

## 🛠️ Maintenance

### Regular Maintenance Tasks

1. **Update base images:**
   ```bash
   docker-compose -f docker-compose.prod.yml pull
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Clean up old backups:**
   ```bash
   # Automatic cleanup is handled by backup script
   # Manual cleanup if needed
   find backups/ -name "*.sql" -mtime +30 -delete
   ```

3. **Monitor disk space:**
   ```bash
   docker system df
   docker system prune -f
   ```

4. **Check logs:**
   ```bash
   ./deploy.sh production logs
   ```

### Troubleshooting

#### Common Issues

1. **Services not starting:**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs [service_name]
   
   # Check health
   docker-compose -f docker-compose.prod.yml ps
   ```

2. **Database connection issues:**
   ```bash
   # Check database status
   docker-compose -f docker-compose.prod.yml exec db pg_isready -U postgres
   
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs db
   ```

3. **SSL certificate issues:**
   ```bash
   # Check certificate validity
   openssl x509 -in ssl/your_cert.crt -text -noout
   
   # Test SSL connection
   openssl s_client -connect yourdomain.com:443
   ```

#### Performance Optimization

1. **Database optimization:**
   - Monitor slow queries
   - Optimize indexes
   - Regular VACUUM and ANALYZE

2. **Application optimization:**
   - Enable Redis caching
   - Optimize API responses
   - Use CDN for static assets

3. **Infrastructure optimization:**
   - Monitor resource usage
   - Scale services as needed
   - Optimize Docker images

## 📈 Scaling

### Horizontal Scaling

To scale services horizontally:

```bash
# Scale backend services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Scale frontend services
docker-compose -f docker-compose.prod.yml up -d --scale frontend=2
```

### Load Balancing

Nginx automatically load balances between multiple instances:

- **Backend:** Round-robin load balancing
- **Frontend:** Static file serving with caching
- **Health checks:** Automatic failover

### Database Scaling

For database scaling:

1. **Read replicas:** Set up PostgreSQL read replicas
2. **Connection pooling:** Use PgBouncer
3. **Sharding:** Implement database sharding for large datasets

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to server
        run: |
          ssh user@server "cd /path/to/infrastructure && ./deploy.sh production"
```

### Environment-Specific Deployments

- **Development:** Automatic deployment on feature branches
- **Staging:** Manual deployment for testing
- **Production:** Automated deployment from main branch

## 📞 Support

### Getting Help

1. **Check logs:** Use `./deploy.sh [env] logs`
2. **Health checks:** Verify all services are healthy
3. **Documentation:** Review this README and application docs
4. **Issues:** Create GitHub issues for bugs or feature requests

### Emergency Procedures

1. **Service down:** Check health endpoints and logs
2. **Database issues:** Check database connectivity and logs
3. **SSL issues:** Verify certificate validity and renewal
4. **Performance issues:** Monitor resource usage and scale if needed

## 📝 Changelog

### Version 1.0.0
- Initial infrastructure setup
- Docker Compose configurations
- Nginx reverse proxy
- Redis caching
- PostgreSQL database
- Monitoring with Prometheus and Grafana
- Automated backup system
- SSL/TLS support
- Health checks
- Security hardening

---

**Note:** This infrastructure is designed for production use but should be thoroughly tested in a staging environment before deployment to production. 