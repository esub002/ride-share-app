# ⚡ Quick Setup Reference

## 🚀 Fastest Way to Production

### 1. Generate Secrets
```bash
cd backend
node scripts/generate-secrets.js
```

### 2. Configure Environment
```bash
cp env.example env.production
# Edit env.production with your values
```

### 3. Setup Database
```bash
# Option A: Docker (Recommended for quick start)
docker-compose -f docker-compose.prod.yml up -d db redis

# Option B: Automated setup
./scripts/setup-database.sh
```

### 4. Setup SSL
```bash
# Option A: Let's Encrypt (Free)
./scripts/setup-ssl.sh

# Option B: Manual
sudo apt install certbot python3-certbot-nginx nginx -y
sudo certbot --nginx -d yourdomain.com
```

### 5. Deploy
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Common Commands

### Database
```bash
# Start database only
docker-compose -f docker-compose.prod.yml up -d db redis

# Connect to database
docker-compose -f docker-compose.prod.yml exec db psql -U ride_share_user -d ride_share_production

# Run migrations
node scripts/migrate.js
```

### SSL/Certificates
```bash
# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run
```

### Application
```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Restart services
docker-compose -f docker-compose.prod.yml restart

# Stop all services
docker-compose -f docker-compose.prod.yml down
```

### Monitoring
```bash
# Start monitoring
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

# View worker logs
docker-compose -f docker-compose.prod.yml logs -f email-worker
docker-compose -f docker-compose.prod.yml logs -f analytics-worker
```

### Health Checks
```bash
# API health
curl http://localhost:3000/health

# Database health
curl http://localhost:3000/api/health/db

# Redis health
curl http://localhost:3000/api/health/redis
```

## 🚨 Troubleshooting

### Database Issues
```bash
# Check database logs
docker-compose -f docker-compose.prod.yml logs db

# Test connection
node test-db-connection.js

# Reset database
docker-compose -f docker-compose.prod.yml down
docker volume rm backend_postgres_data
docker-compose -f docker-compose.prod.yml up -d db redis
```

### SSL Issues
```bash
# Check Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Check certificate
sudo certbot certificates

# Force renew
sudo certbot renew --force-renewal
```

### Application Issues
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Restart app
docker-compose -f docker-compose.prod.yml restart app

# Check environment
docker-compose -f docker-compose.prod.yml exec app env
```

## 📊 Environment Variables Quick Reference

### Required Variables
```bash
# Database
DB_HOST=your-db-host
DB_NAME=ride_share_production
DB_USER=ride_share_user
DB_PASSWORD=your-secure-password

# Redis
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-secure-redis-password

# JWT (use generated values)
JWT_SECRET=your-generated-jwt-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret

# Security (use generated values)
ENCRYPTION_KEY=your-generated-encryption-key
API_KEY_SECRET=your-generated-api-key-secret
SESSION_SECRET=your-generated-session-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
CORS_ORIGIN=https://yourdomain.com
SOCKET_CORS_ORIGIN=https://yourdomain.com
```

### Optional Variables
```bash
# SSL
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem

# Third-party APIs
GOOGLE_MAPS_API_KEY=your-google-maps-key
STRIPE_SECRET_KEY=your-stripe-secret-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
```

## 🔒 Security Checklist

- [ ] All secrets changed from defaults
- [ ] Database password is secure
- [ ] Redis password is set
- [ ] SSL certificate is valid
- [ ] Firewall is configured
- [ ] Environment file is not committed
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured

## 📞 Quick Help

### Test Everything
```bash
# Run all tests
npm test

# Test database connection
node test-db-connection.js

# Test SSL
curl -k https://yourdomain.com/health

# Test API
curl -X POST http://localhost:3000/api/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"Test1234!"}'
```

### Useful URLs
- Health Check: `http://localhost:3000/health`
- API Docs: `http://localhost:3000/api-docs`
- Grafana: `http://localhost:3001` (admin/admin123)
- Prometheus: `http://localhost:9090`

### Emergency Commands
```bash
# Stop everything
docker-compose -f docker-compose.prod.yml down

# Start fresh
docker-compose -f docker-compose.prod.yml up -d

# View all logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory usage
free -h
```

---

**⚡ Quick setup complete! Your backend is ready for production.** 