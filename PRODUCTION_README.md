# 🚀 Production Deployment Guide

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] Create `.env` file with production values
- [ ] Set up PostgreSQL database
- [ ] Configure SSL certificates
- [ ] Set up domain and DNS
- [ ] Configure firewall rules

### ✅ Security Configuration
- [ ] JWT secret key (32+ characters)
- [ ] Database password (strong)
- [ ] SSL/TLS certificates
- [ ] CORS origins configured
- [ ] Rate limiting enabled
- [ ] Input sanitization active

### ✅ Database Setup
- [ ] PostgreSQL installed and running
- [ ] Database created
- [ ] User permissions set
- [ ] Schema migrations applied
- [ ] Safety schema applied
- [ ] Indexes created

## 🛠️ Installation Steps

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install Docker (optional)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 2. Application Deployment
```bash
# Clone repository
git clone https://github.com/your-org/ride-share-app.git
cd ride-share-app/backend

# Install dependencies
npm ci --production

# Set up environment
cp .env.example .env
# Edit .env with production values

# Run database migrations
npm run migrate

# Start application
npm start
```

### 3. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Systemd Service Setup
```bash
# Create service file
sudo nano /etc/systemd/system/ride-share-backend.service

# Enable and start service
sudo systemctl enable ride-share-backend
sudo systemctl start ride-share-backend
```

## 🔧 Configuration Files

### Environment Variables (.env)
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/ride_share_prod
JWT_SECRET=your_super_secure_jwt_secret_key_here
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

### Nginx Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring & Logging

### Health Checks
```bash
# Application health
curl https://your-domain.com/health

# Database health
pg_isready -h localhost -p 5432

# Service status
sudo systemctl status ride-share-backend
```

### Log Monitoring
```bash
# Application logs
sudo journalctl -u ride-share-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## 🔄 Backup Strategy

### Automated Backups
```bash
# Create backup script
nano /opt/scripts/backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /opt/scripts/backup.sh
```

### Manual Backup
```bash
# Database backup
pg_dump ride_share_prod > backup-$(date +%Y%m%d).sql

# Application backup
tar -czf app-backup-$(date +%Y%m%d).tar.gz /opt/ride-share
```

## 🚨 Emergency Procedures

### Service Restart
```bash
sudo systemctl restart ride-share-backend
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

### Database Recovery
```bash
# Stop application
sudo systemctl stop ride-share-backend

# Restore database
psql ride_share_prod < backup-file.sql

# Start application
sudo systemctl start ride-share-backend
```

### SSL Certificate Renewal
```bash
# Manual renewal
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## 📈 Performance Optimization

### Database Optimization
```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_rides_driver_id ON rides(driver_id);
CREATE INDEX CONCURRENTLY idx_rides_status ON rides(status);
CREATE INDEX CONCURRENTLY idx_emergency_alerts_status ON emergency_alerts(status);

-- Analyze tables
ANALYZE rides;
ANALYZE emergency_alerts;
ANALYZE incident_reports;
```

### Application Optimization
```bash
# Enable PM2 for process management
npm install -g pm2
pm2 start server.js --name "ride-share-backend"

# Monitor performance
pm2 monit
```

## 🔒 Security Hardening

### Firewall Configuration
```bash
# Configure UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### Database Security
```sql
-- Create application user
CREATE USER ride_share_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ride_share_prod TO ride_share_user;
GRANT USAGE ON SCHEMA public TO ride_share_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ride_share_user;
```

### Application Security
```bash
# Set file permissions
sudo chown -R nodejs:nodejs /opt/ride-share
sudo chmod 755 /opt/ride-share
sudo chmod 600 /opt/ride-share/.env
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly: Review logs for errors
- [ ] Monthly: Update system packages
- [ ] Quarterly: Review security settings
- [ ] Annually: Renew SSL certificates

### Monitoring Alerts
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Monitor disk space
- [ ] Track API response times

### Contact Information
- **Emergency**: [Emergency Contact]
- **Technical Support**: [Support Email]
- **Documentation**: [Wiki Link]

## 🎯 Success Metrics

### Performance Targets
- API response time: < 200ms
- Uptime: > 99.9%
- Database connections: < 80% capacity
- Error rate: < 0.1%

### Safety Features Monitoring
- Emergency alerts: < 5s response time
- Incident reports: 100% logged
- Location sharing: Real-time updates
- Voice commands: > 95% accuracy

---

**Last Updated**: $(date)
**Version**: 1.0.0
**Environment**: Production 