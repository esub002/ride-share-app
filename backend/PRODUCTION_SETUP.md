# 🚀 Production Environment Setup Guide

## 📋 Prerequisites

Before setting up production, ensure you have:
- [ ] Docker and Docker Compose installed
- [ ] A production server (VPS, cloud instance, etc.)
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificates (for HTTPS)

## 🔐 Step 1: Generate Secure Secrets

### Option A: Using the Script (Recommended)
```bash
# Run the secret generation script
node scripts/generate-secrets.js
```

### Option B: Manual Generation
```bash
# Generate JWT secrets
openssl rand -hex 64
# Generate encryption key
openssl rand -hex 32
# Generate API key
echo "rs_$(openssl rand -hex 32)"
# Generate database password
openssl rand -hex 16
# Generate Redis password
openssl rand -hex 16
```

## 🌍 Step 2: Configure Environment Variables

1. **Copy the example file:**
   ```bash
   cp env.example env.production
   ```

2. **Update `env.production` with your values:**

   ### Critical Security Variables (MUST CHANGE):
   ```bash
   # Generate these using the script above
   JWT_SECRET=your-generated-jwt-secret
   JWT_REFRESH_SECRET=your-generated-refresh-secret
   ENCRYPTION_KEY=your-generated-encryption-key
   API_KEY_SECRET=your-generated-api-key-secret
   SESSION_SECRET=your-generated-session-secret
   DB_PASSWORD=your-generated-db-password
   REDIS_PASSWORD=your-generated-redis-password
   API_KEY=your-generated-api-key
   ```

   ### Database Configuration:
   ```bash
   DB_HOST=your-production-db-host
   DB_NAME=ride_share_production
   DB_USER=ride_share_user
   DATABASE_URL=postgresql://ride_share_user:password@host:5432/ride_share_production
   ```

   ### Redis Configuration:
   ```bash
   REDIS_HOST=your-production-redis-host
   REDIS_PASSWORD=your-generated-redis-password
   ```

   ### Email Configuration:
   ```bash
   EMAIL_HOST=smtp.gmail.com
   EMAIL_USER=your-production-email@gmail.com
   EMAIL_PASS=your-app-specific-password
   EMAIL_FROM=noreply@yourdomain.com
   ```

   ### Frontend Configuration:
   ```bash
   CORS_ORIGIN=https://your-frontend-domain.com
   SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
   ```

   ### Third-Party API Keys:
   ```bash
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

## 🗄️ Step 3: Database Setup

### Option A: Using Docker Compose (Recommended for small to medium scale)
```bash
# The database will be automatically created with the docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d db
```

### Option B: External Database (Recommended for production)
1. Set up PostgreSQL on your server or use a managed service
2. Create the database and user:
   ```sql
   CREATE DATABASE ride_share_production;
   CREATE USER ride_share_user WITH PASSWORD 'your-secure-password';
   GRANT ALL PRIVILEGES ON DATABASE ride_share_production TO ride_share_user;
   ```
3. Run the schema files:
   ```bash
   psql -h your-db-host -U ride_share_user -d ride_share_production -f schema.sql
   psql -h your-db-host -U ride_share_user -d ride_share_production -f safety-schema.sql
   psql -h your-db-host -U ride_share_user -d ride_share_production -f analytics-schema.sql
   psql -h your-db-host -U ride_share_user -d ride_share_production -f security-schema.sql
   ```

## 🔴 Step 4: Redis Setup

### Option A: Using Docker Compose
```bash
# Redis will be automatically created with the docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d redis
```

### Option B: External Redis (Recommended for production)
1. Set up Redis on your server or use a managed service
2. Configure Redis with password authentication
3. Update your `env.production` with the Redis connection details

## 🐳 Step 5: Deploy with Docker

### Build and Deploy:
```bash
# Build the production images
docker-compose -f docker-compose.prod.yml build

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### Health Checks:
```bash
# Check if the API is responding
curl http://localhost:3000/health

# Check database connection
docker-compose -f docker-compose.prod.yml exec app node test-db-connection.js

# Check Redis connection
docker-compose -f docker-compose.prod.yml exec app node -e "
const Redis = require('ioredis');
const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});
redis.ping().then(() => console.log('Redis connected')).catch(console.error);
"
```

## 🔒 Step 6: Security Configuration

### SSL/HTTPS Setup:
1. **Using Nginx (Recommended):**
   ```bash
   # Install Nginx
   sudo apt update && sudo apt install nginx

   # Configure Nginx
   sudo nano /etc/nginx/sites-available/ride-share
   ```

   Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name your-domain.com;

       ssl_certificate /path/to/your/certificate.crt;
       ssl_certificate_key /path/to/your/private.key;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/ride-share /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

### Firewall Configuration:
```bash
# Allow only necessary ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

## 📊 Step 7: Monitoring Setup

### Enable Prometheus and Grafana:
```bash
# Start monitoring services
docker-compose -f docker-compose.prod.yml up -d prometheus grafana

# Access Grafana at http://your-domain.com:3001
# Default credentials: admin / admin123
```

### Log Management:
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# View worker logs
docker-compose -f docker-compose.prod.yml logs -f email-worker
docker-compose -f docker-compose.prod.yml logs -f analytics-worker
docker-compose -f docker-compose.prod.yml logs -f payment-worker
```

## 🔄 Step 8: Background Jobs

The background job workers are automatically started with the production Docker Compose:

- **Email Worker**: Handles email notifications
- **Analytics Worker**: Processes analytics data
- **Payment Worker**: Handles payment processing

### Monitor Workers:
```bash
# Check worker status
docker-compose -f docker-compose.prod.yml ps | grep worker

# View worker logs
docker-compose -f docker-compose.prod.yml logs -f email-worker
```

## 🧪 Step 9: Testing Production

### API Health Check:
```bash
curl https://your-domain.com/health
```

### Database Connection Test:
```bash
curl https://your-domain.com/api/health/db
```

### Redis Connection Test:
```bash
curl https://your-domain.com/api/health/redis
```

### Authentication Test:
```bash
# Test user registration
curl -X POST https://your-domain.com/api/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234!"}'
```

## 🚨 Step 10: Security Checklist

- [ ] All secrets are changed from defaults
- [ ] Database has strong password
- [ ] Redis has password authentication
- [ ] SSL/HTTPS is configured
- [ ] Firewall is properly configured
- [ ] Environment variables are not committed to git
- [ ] Logs are being monitored
- [ ] Backups are configured
- [ ] Rate limiting is enabled
- [ ] CORS is properly configured

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Failed:**
   ```bash
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs db
   
   # Test connection manually
   docker-compose -f docker-compose.prod.yml exec app node test-db-connection.js
   ```

2. **Redis Connection Failed:**
   ```bash
   # Check Redis logs
   docker-compose -f docker-compose.prod.yml logs redis
   
   # Test Redis connection
   docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
   ```

3. **Application Won't Start:**
   ```bash
   # Check application logs
   docker-compose -f docker-compose.prod.yml logs app
   
   # Check environment variables
   docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DB_|REDIS_|JWT_)"
   ```

4. **Workers Not Processing Jobs:**
   ```bash
   # Check worker logs
   docker-compose -f docker-compose.prod.yml logs email-worker
   
   # Check Redis job queues
   docker-compose -f docker-compose.prod.yml exec redis redis-cli
   ```

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify environment variables are set correctly
3. Ensure all services are healthy: `docker-compose -f docker-compose.prod.yml ps`
4. Check the troubleshooting section above

---

**🎉 Congratulations! Your ride-share backend is now deployed in production!** 