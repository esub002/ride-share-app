# Deployment Guide

## 🚀 Overview

This guide covers deploying the Ride Share backend to various environments including development, staging, and production.

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database
- Redis (optional, for scaling)
- Docker (optional)
- Environment variables configured

## 🔧 Environment Setup

### 1. Environment Variables

Copy the environment template and configure your values:

```bash
cp env.example .env
```

Edit `.env` with your actual values:

```bash
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=ride_share_db
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DATABASE_URL=postgresql://your_db_user:your_secure_password@your_db_host:5432/ride_share_db

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secure_jwt_refresh_secret_key_change_this_in_production

# Security Configuration
API_KEY=your_api_key_here
CORS_ORIGIN=https://your-frontend-domain.com
```

### 2. Database Setup

#### Using PostgreSQL

```bash
# Create database
createdb ride_share_db

# Run migrations
npm run migrate

# Setup analytics (optional)
npm run migrate:analytics
```

#### Using Docker

```bash
# Start PostgreSQL with Docker
docker run --name ride-share-postgres \
  -e POSTGRES_DB=ride_share_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15
```

## 🐳 Docker Deployment

### 1. Build Docker Image

```bash
# Build production image
docker build -f Dockerfile.prod -t ride-share-backend:latest .

# Or build development image
docker build -f Dockerfile.dev -t ride-share-backend:dev .
```

### 2. Run with Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 3. Docker Compose Configuration

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/ride_share_db
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=ride_share_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
```

## ☁️ Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance

```bash
# Connect to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Clone repository
git clone https://github.com/your-org/ride-share-app.git
cd ride-share-app/backend

# Install dependencies
npm ci --production

# Setup environment
cp env.example .env
# Edit .env with your values

# Setup database
sudo -u postgres createdb ride_share_db
npm run migrate

# Start application
npm start
```

#### 2. Using PM2 for Process Management

```bash
# Install PM2
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "ride-share-backend"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### 3. Using Nginx as Reverse Proxy

```bash
# Install Nginx
sudo apt-get install nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/ride-share-backend
```

Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ride-share-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Heroku Deployment

#### 1. Setup Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-ride-share-backend

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set API_KEY=your_api_key
```

#### 2. Deploy to Heroku

```bash
# Add Heroku remote
heroku git:remote -a your-ride-share-backend

# Deploy
git push heroku main

# Run migrations
heroku run npm run migrate

# Open app
heroku open
```

### DigitalOcean Deployment

#### 1. Using App Platform

1. Connect your GitHub repository to DigitalOcean App Platform
2. Configure build settings:
   - Build Command: `npm ci --production`
   - Run Command: `npm start`
3. Set environment variables
4. Deploy

#### 2. Using Droplets

```bash
# Create droplet and SSH in
ssh root@your-droplet-ip

# Install Node.js and PostgreSQL
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs postgresql postgresql-contrib

# Setup application
git clone https://github.com/your-org/ride-share-app.git
cd ride-share-app/backend
npm ci --production

# Setup environment and database
cp env.example .env
# Edit .env
sudo -u postgres createdb ride_share_db
npm run migrate

# Start with PM2
npm install -g pm2
pm2 start server.js --name "ride-share-backend"
pm2 startup
pm2 save
```

## 🔒 SSL/HTTPS Setup

### Using Let's Encrypt

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Using Cloudflare

1. Add your domain to Cloudflare
2. Update nameservers
3. Enable SSL/TLS encryption mode to "Full"
4. Configure DNS records

## 📊 Monitoring and Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install -g pm2
npm install -g clinic

# Monitor with PM2
pm2 monit

# Profile with Clinic
clinic doctor -- node server.js
```

### 2. Log Management

```bash
# Create logs directory
mkdir -p logs

# View logs
tail -f logs/app.log
tail -f logs/error.log

# Rotate logs (add to crontab)
0 0 * * * logrotate /etc/logrotate.d/ride-share-backend
```

### 3. Health Checks

```bash
# Health check endpoint
curl https://your-domain.com/health

# Monitor with external service
# Add to your monitoring service (UptimeRobot, Pingdom, etc.)
```

## 🔄 CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Backend

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Deploy to production
      run: |
        # Your deployment commands here
        echo "Deploying to production..."
```

## 🚨 Backup and Recovery

### 1. Database Backup

```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
EOF

chmod +x backup.sh

# Add to crontab
0 2 * * * /path/to/backup.sh
```

### 2. Application Backup

```bash
# Backup application files
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=logs \
  --exclude=.git \
  .
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Issues

```bash
# Check database connection
npm run test:db-connection

# Verify environment variables
echo $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql
```

#### 2. Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### 3. Memory Issues

```bash
# Check memory usage
free -h

# Monitor Node.js memory
node --max-old-space-size=4096 server.js
```

#### 4. SSL Issues

```bash
# Check SSL certificate
openssl s_client -connect your-domain.com:443

# Test HTTPS
curl -I https://your-domain.com/health
```

## 📞 Support

For deployment issues:

1. Check logs: `tail -f logs/error.log`
2. Verify environment variables
3. Test database connection
4. Check network connectivity
5. Review security group/firewall settings

## 📚 Additional Resources

- [Security Documentation](./SECURITY_README.md)
- [API Documentation](./API_DOCUMENTATION.md)
- [Real-time Testing Guide](./REALTIME_TESTING.md)
- [Quick Start Guide](./QUICK_START.md) 