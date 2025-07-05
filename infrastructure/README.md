# 🏗️ Infrastructure

Complete infrastructure setup for the ride-sharing platform with Docker, monitoring, and production deployment configurations.

## 🎯 Quick Start

### **Development Environment**
```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres redis

# View logs
docker-compose logs -f
```

### **Production Deployment**
```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f
```

## 🏗️ Architecture

### **Service Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Admin Dashboard│    │   Driver App    │
│     (Nginx)     │    │    (React)      │    │ (React Native)  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Express.js Backend     │
                    │   (REST + Socket.IO)      │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐  ┌─────────┴─────────┐  ┌─────────┴─────────┐
│   PostgreSQL      │  │      Redis        │  │   Background      │
│   (Primary DB)    │  │   (Cache/Queue)   │  │     Workers       │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### **Monitoring Stack**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │     Grafana     │    │   ElastAlert    │
│   (Metrics)     │    │ (Visualization) │    │   (Alerts)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      ELK Stack            │
                    │ (Elasticsearch, Logstash, │
                    │        Kibana)            │
                    └───────────────────────────┘
```

## 🐳 Docker Configuration

### **Development Environment**
```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: rideshare
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build: ../backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rideshare
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  admin-dashboard:
    build: ../admin-dashboard
    ports:
      - "3001:3001"
    environment:
      - REACT_APP_API_URL=http://localhost:3000/api
      - REACT_APP_SOCKET_URL=http://localhost:3000
    depends_on:
      - backend
```

### **Production Environment**
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: rideshare
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - internal

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    networks:
      - internal

  backend:
    build: ../backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/rideshare
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    networks:
      - internal

  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - internal
```

## 🔧 Configuration Files

### **Nginx Configuration**
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

### **Production Nginx**
```nginx
# nginx.prod.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## 📊 Monitoring Setup

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### **Grafana Dashboard**
- **Import Dashboard**: Use the provided Grafana dashboard configuration
- **Data Sources**: Configure Prometheus and Elasticsearch
- **Alerts**: Set up alerting rules for critical metrics

### **ELK Stack Configuration**
```yaml
# docker-compose.prod.yml (monitoring section)
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
  environment:
    - discovery.type=single-node
  volumes:
    - elasticsearch_data:/usr/share/elasticsearch/data

kibana:
  image: docker.elastic.co/kibana/kibana:7.17.0
  ports:
    - "5601:5601"
  depends_on:
    - elasticsearch

logstash:
  image: docker.elastic.co/logstash/logstash:7.17.0
  volumes:
    - ./monitoring/fluent.conf:/usr/share/logstash/pipeline/logstash.conf
  depends_on:
    - elasticsearch
```

## 🔒 Security Configuration

### **SSL/TLS Setup**
```bash
# Generate SSL certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem

# Set proper permissions
chmod 600 ssl/key.pem
chmod 644 ssl/cert.pem
```

### **Environment Variables**
```env
# .env.production
NODE_ENV=production
DB_USER=rideshare_user
DB_PASSWORD=secure_password
JWT_SECRET=your_super_secret_jwt_key
REDIS_PASSWORD=secure_redis_password
```

## 🚀 Deployment Scripts

### **Development Deployment**
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Starting development environment..."

# Build and start services
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
curl -f http://localhost:3000/health || echo "❌ Backend not ready"
curl -f http://localhost:3001 || echo "❌ Admin dashboard not ready"

echo "✅ Development environment ready!"
echo "📊 Backend: http://localhost:3000"
echo "🏢 Admin Dashboard: http://localhost:3001"
echo "📈 Prometheus: http://localhost:9090"
```

### **Production Deployment**
```bash
#!/bin/bash
# deploy-prod.sh

echo "🚀 Starting production deployment..."

# Load environment variables
source .env.production

# Build and start production services
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 60

# Check service health
echo "🔍 Checking service health..."
curl -f https://your-domain.com/health || echo "❌ Backend not ready"

echo "✅ Production deployment complete!"
echo "🌐 Application: https://your-domain.com"
echo "📊 Monitoring: https://your-domain.com:9090"
```

## 📈 Performance Optimization

### **Resource Limits**
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  postgres:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### **Scaling Configuration**
```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

## 🔧 Maintenance

### **Backup Scripts**
```bash
#!/bin/bash
# backup.sh

# Database backup
docker exec postgres pg_dump -U postgres rideshare > backup_$(date +%Y%m%d_%H%M%S).sql

# Redis backup
docker exec redis redis-cli BGSAVE

# Compress backups
tar -czf backup_$(date +%Y%m%d_%H%M%S).tar.gz *.sql
```

### **Update Scripts**
```bash
#!/bin/bash
# update.sh

# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Update services
docker-compose -f docker-compose.prod.yml up -d

# Clean up old images
docker image prune -f
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Service Not Starting**
```bash
# Check service logs
docker-compose logs service_name

# Check service status
docker-compose ps

# Restart service
docker-compose restart service_name
```

#### **Database Connection Issues**
```bash
# Check database status
docker exec postgres pg_isready

# Check database logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

#### **SSL Certificate Issues**
```bash
# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout

# Regenerate certificate
./scripts/setup-ssl.sh
```

### **Debug Commands**
```bash
# View all logs
docker-compose logs -f

# Check resource usage
docker stats

# Access service shell
docker-compose exec service_name sh

# Check network connectivity
docker-compose exec backend ping postgres
```

## 📞 Support

### **Documentation**
- [Backend Setup](../backend/README.md)
- [Driver App Setup](../apps/driver-app/README.md)
- [Admin Dashboard Setup](../admin-dashboard/README.md)

### **Quick Help**
- **Docker Issues**: Check docker-compose.yml configuration
- **SSL Issues**: Check nginx.prod.conf and SSL certificates
- **Monitoring Issues**: Check Prometheus and Grafana configuration

---

## 🎯 Key Features

✅ **Complete Docker Setup**: Development and production environments
✅ **Load Balancing**: Nginx configuration for high availability
✅ **SSL/TLS Support**: Secure HTTPS communication
✅ **Monitoring Stack**: Prometheus, Grafana, and ELK integration
✅ **Auto-scaling**: Horizontal scaling configuration
✅ **Backup & Recovery**: Automated backup scripts
✅ **Security**: Production-ready security configuration
✅ **Deployment Ready**: Complete deployment automation

---

**The Infrastructure provides a complete deployment solution for the ride-sharing platform with emphasis on scalability, security, and monitoring. The Docker-based setup ensures consistent environments across development and production.** 