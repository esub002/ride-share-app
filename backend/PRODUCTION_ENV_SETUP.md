# 🔐 Production Environment Setup Guide

## 🎯 Quick Start

Your backend tests are now **100% passing**! Let's set up the production environment for deployment.

## 📋 Step 1: Create Production Environment File

1. **Copy the example file:**
   ```bash
   cp env.example env.production
   ```

2. **Edit the production environment file:**
   ```bash
   nano env.production
   # or use your preferred editor
   ```

## 🔑 Step 2: Update Critical Security Variables

Replace the placeholder values with the secure secrets generated above:

```bash
# JWT Configuration (CRITICAL - Use the generated values)
JWT_SECRET=e44c9b3c80618a0935bee05fa7b17a6d55381f265d4675a00a4edaf086a8d4cde4d53ae7ccccea72b5a00709056965b651b8da3cd30189abe34d2685230d91f8
JWT_REFRESH_SECRET=8d414585a78a522fabffbc24294da21c23250a2e31358a0959a72d68155a26bc9a3f289a580c1f9cdf21ad1e824f27a57404bc19d36ab2cfd16ad1f2b3088d9c
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security Configuration (CRITICAL - Use the generated values)
ENCRYPTION_KEY=090ea487a7c42d4eb73b0d069793725d1467ad6b9e7a8cbfd26dd59458027745
API_KEY_SECRET=731a8b34c08621ea61f4c99ea15b4f111abf9852aa76f1580f864ce9fb6d7d2b
BCRYPT_ROUNDS=12
SESSION_SECRET=1c89def070ddfc4b0906ab57ac5edcf5f267cf8732ddd89e4a1c33e9e63bc768

# Database Configuration (UPDATE with your actual database details)
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=ride_share_production
DB_USER=ride_share_user
DB_PASSWORD=f0460a0af507f9a8cf8e57b443194fad
DATABASE_URL=postgresql://ride_share_user:f0460a0af507f9a8cf8e57b443194fad@your-production-db-host:5432/ride_share_production

# Redis Configuration (UPDATE with your actual Redis details)
REDIS_HOST=your-production-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=f67ad7e76f8113e0268fea84b375ee32
REDIS_DB=0
REDIS_PREFIX=rideshare_prod:

# API Key (Use the generated value)
API_KEY=rs_18ecf56cd0d922866120006547e2e8c5ce0f1c9cae937a3f4ae0871d1e644f7b
```

## 🌍 Step 3: Update Environment-Specific Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX_REQUESTS=5

# Email Configuration (UPDATE with your email service)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-specific-password
EMAIL_FROM=noreply@yourdomain.com

# Logging Configuration
LOG_LEVEL=info
LOG_FILE=logs/app.log
ERROR_LOG_FILE=logs/error.log

# Socket.IO Configuration (UPDATE with your frontend domain)
SOCKET_CORS_ORIGIN=https://your-frontend-domain.com
SOCKET_PING_TIMEOUT=60000
SOCKET_PING_INTERVAL=25000

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_DB_NAME=ride_share_analytics_production

# Safety Configuration (UPDATE with your domain)
SAFETY_ALERT_EMAIL=safety@yourdomain.com
EMERGENCY_CONTACT=911

# Session Configuration
SESSION_MAX_AGE=86400000

# Password Policy
MIN_PASSWORD_LENGTH=8
REQUIRE_UPPERCASE=true
REQUIRE_LOWERCASE=true
REQUIRE_NUMBERS=true
REQUIRE_SPECIAL_CHARS=true

# Login Security
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION=900000
REQUIRE_EMAIL_VERIFICATION=true

# Development Settings (DISABLE IN PRODUCTION)
ENABLE_MOCK_DATA=false
ENABLE_DEBUG_LOGGING=false
SKIP_EMAIL_VERIFICATION=false

# Third Party API Keys (UPDATE with your actual API keys)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key

# Security Configuration (UPDATE with your frontend domain)
CORS_ORIGIN=https://your-frontend-domain.com

# Background Jobs Configuration
BULLMQ_REDIS_URL=redis://:f67ad7e76f8113e0268fea84b375ee32@your-production-redis-host:6379/1
BULLMQ_PREFIX=rideshare_jobs:

# Monitoring and Health Checks
HEALTH_CHECK_ENABLED=true
METRICS_ENABLED=true

# Sentry Configuration (Optional - for error tracking)
SENTRY_DSN=your-sentry-dsn-url
```

## 🗄️ Step 4: Database Setup Options

### Option A: Local Docker Database (Development/Testing)
```bash
# Use the existing docker-compose.yml for local development
docker-compose up -d db
```

### Option B: Production Database (Recommended)
1. **Set up PostgreSQL on your server or use a managed service**
2. **Create database and user:**
   ```sql
   CREATE DATABASE ride_share_production;
   CREATE USER ride_share_user WITH PASSWORD 'f0460a0af507f9a8cf8e57b443194fad';
   GRANT ALL PRIVILEGES ON DATABASE ride_share_production TO ride_share_user;
   ```
3. **Run schema files:**
   ```bash
   psql -h your-db-host -U ride_share_user -d ride_share_production -f schema.sql
   psql -h your-db-host -U ride_share_user -d ride_share_production -f safety-schema.sql
   psql -h your-db-host -U ride_share_user -d ride_share_production -f analytics-schema.sql
   psql -h your-db-host -U ride_share_user -d ride_share_production -f security-schema.sql
   ```

## 🔴 Step 5: Redis Setup Options

### Option A: Local Docker Redis (Development/Testing)
```bash
# Use the existing docker-compose.yml for local development
docker-compose up -d redis
```

### Option B: Production Redis (Recommended)
1. **Set up Redis on your server or use a managed service**
2. **Configure Redis with password authentication**
3. **Update your env.production with the Redis connection details**

## 🐳 Step 6: Deploy with Docker

### For Local/Development Testing:
```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

### For Production:
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

## ✅ Step 7: Verify Deployment

### Health Checks:
```bash
# API Health
curl http://localhost:3000/health

# Database Connection
curl http://localhost:3000/api/health/db

# Redis Connection
curl http://localhost:3000/api/health/redis
```

### Test API Endpoints:
```bash
# Test user registration
curl -X POST http://localhost:3000/api/auth/user/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234!"}'

# Test login
curl -X POST http://localhost:3000/api/auth/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'
```

## 🔒 Step 8: Security Checklist

- [ ] All secrets are changed from defaults
- [ ] Database has strong password
- [ ] Redis has password authentication
- [ ] Environment variables are not committed to git
- [ ] CORS is properly configured for your frontend domain
- [ ] Rate limiting is enabled
- [ ] SSL/HTTPS is configured (for production)

## 🚨 Important Security Notes

1. **Never commit `env.production` to version control**
2. **Keep the generated secrets secure**
3. **Use HTTPS in production**
4. **Set up proper firewall rules**
5. **Regularly rotate secrets**
6. **Monitor logs for security issues**

## 📞 Next Steps

After setting up the environment:

1. **Test the deployment locally**
2. **Set up your production server**
3. **Configure domain and SSL certificates**
4. **Set up monitoring and alerting**
5. **Configure automated backups**

---

**🎉 Your production environment is now configured and ready for deployment!** 