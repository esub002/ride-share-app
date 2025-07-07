# 🏗️ Infrastructure

Complete infrastructure setup for the ride-sharing platform with Docker, monitoring, production deployment configurations, and enhanced real-time services.

## 🆕 Latest Updates (2025)

### **🚀 Real-Time Performance Dashboard**
- **Live Performance Metrics**: Real-time monitoring of system performance
- **Advanced Analytics**: Comprehensive data visualization and reporting
- **Performance Optimization**: Enhanced caching and database optimization
- **Real-time Alerts**: Instant notifications for system issues

### **📍 Advanced Location & Safety Services**
- **Geofencing Support**: Location-based triggers and notifications
- **Enhanced GPS Tracking**: Improved accuracy and reliability
- **Real-time Location Updates**: Sub-second location synchronization
- **Advanced Safety Monitoring**: Comprehensive safety tracking with backend integration

### **💬 Enhanced Communication Infrastructure**
- **Voice/Video Call Services**: Integrated calling infrastructure
- **Advanced Messaging Services**: Rich media support and file sharing
- **Real-time Chat Infrastructure**: Instant messaging with typing indicators
- **Push Notification Services**: Cross-platform notification system

### **📊 Enhanced Monitoring & Analytics**
- **Real-time Analytics**: Live performance metrics and monitoring
- **Advanced Reporting**: Comprehensive data visualization and reporting
- **Performance Optimization**: Enhanced caching and database optimization
- **Real-time Alerts**: Instant notifications for system issues

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
                    │  + Real-time Services     │
                    └─────────────┬─────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
┌─────────┴─────────┐  ┌─────────┴─────────┐  ┌─────────┴─────────┐
│   PostgreSQL      │  │      Redis        │  │   Background      │
│   (Primary DB)    │  │   (Cache/Queue)   │  │     Workers       │
│  + Real-time DB   │  │ + Real-time Cache │  │ + Real-time Jobs  │
└───────────────────┘  └───────────────────┘  └───────────────────┘
```

### **Enhanced Monitoring Stack**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Prometheus    │    │     Grafana     │    │   ElastAlert    │
│   (Metrics)     │    │ (Visualization) │    │   (Alerts)      │
│ + Real-time     │    │ + Real-time     │    │ + Real-time     │
│   Performance   │    │   Dashboards    │    │   Alerts        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      ELK Stack            │
                    │ (Elasticsearch, Logstash, │
                    │        Kibana)            │
                    │ + Real-time Analytics     │
                    └───────────────────────────┘
```

### **Real-time Services Architecture**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Real-time       │    │ Advanced        │    │ Enhanced        │
│ Performance     │    │ Location        │    │ Communication   │
│ Dashboard       │    │ Tracking        │    │ Services        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    Real-time Manager      │
                    │   (Socket.IO + Redis)     │
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
      - ../backend/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ../backend/safety-schema.sql:/docker-entrypoint-initdb.d/02-safety-schema.sql
      - ../backend/analytics-schema.sql:/docker-entrypoint-initdb.d/03-analytics-schema.sql
      - ../backend/real-time-schema.sql:/docker-entrypoint-initdb.d/04-real-time-schema.sql

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    build: ../backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rideshare
      - REDIS_URL=redis://redis:6379
      - REALTIME_ENABLED=true
      - LOCATION_TRACKING_ENABLED=true
      - COMMUNICATION_ENABLED=true
      - PERFORMANCE_DASHBOARD_ENABLED=true
    depends_on:
      - postgres
      - redis
    volumes:
      - ../backend:/app
      - /app/node_modules

  admin-dashboard:
    build: ../admin-dashboard
    ports:
      - "3001:3001"
    environment:
      - REACT_APP_API_URL=http://localhost:3000/api
      - REACT_APP_SOCKET_URL=http://localhost:3000
      - REACT_APP_REALTIME_ENABLED=true
      - REACT_APP_LOCATION_TRACKING_ENABLED=true
      - REACT_APP_COMMUNICATION_ENABLED=true
      - REACT_APP_PERFORMANCE_DASHBOARD_ENABLED=true
    depends_on:
      - backend

  web-interface:
    build: ../web
    ports:
      - "3002:3002"
    environment:
      - REACT_APP_API_URL=http://localhost:3000/api
      - REACT_APP_SOCKET_URL=http://localhost:3000
      - REACT_APP_REALTIME_ENABLED=true
      - REACT_APP_LOCATION_TRACKING_ENABLED=true
      - REACT_APP_COMMUNICATION_ENABLED=true
    depends_on:
      - backend

  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - monitoring

  grafana:
    image: grafana/grafana
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring

volumes:
  postgres_data:
  redis_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
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
    networks:
      - frontend

  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: rideshare
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ../backend/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ../backend/safety-schema.sql:/docker-entrypoint-initdb.d/02-safety-schema.sql
      - ../backend/analytics-schema.sql:/docker-entrypoint-initdb.d/03-analytics-schema.sql
      - ../backend/real-time-schema.sql:/docker-entrypoint-initdb.d/04-real-time-schema.sql
    networks:
      - backend

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    networks:
      - backend

  backend:
    build: ../backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/rideshare
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - REALTIME_ENABLED=true
      - LOCATION_TRACKING_ENABLED=true
      - COMMUNICATION_ENABLED=true
      - PERFORMANCE_DASHBOARD_ENABLED=true
    depends_on:
      - postgres
      - redis
    networks:
      - backend
    restart: unless-stopped

  monitoring:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - monitoring
    restart: unless-stopped

  grafana:
    image: grafana/grafana
    ports:
      - "3003:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring
    restart: unless-stopped

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    networks:
      - monitoring
    restart: unless-stopped

  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.0
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    networks:
      - monitoring
    depends_on:
      - elasticsearch
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  grafana_data:
  elasticsearch_data:

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
  monitoring:
    driver: bridge
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

    # Real-time WebSocket support
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        listen 80;
        server_name localhost;

        # Real-time WebSocket endpoints
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # API endpoints
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
```

## 🔧 Development Setup

### **Prerequisites**
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 14+ (optional, for local development)
- Redis 6+ (optional, for local development)

### **Environment Configuration**
```env
# .env
# Database
DB_USER=postgres
DB_PASSWORD=secure_password
DATABASE_URL=postgresql://postgres:secure_password@localhost:5432/rideshare

# Redis
REDIS_PASSWORD=secure_redis_password
REDIS_URL=redis://:secure_redis_password@localhost:6379

# JWT
JWT_SECRET=your_jwt_secret_key

# Monitoring
GRAFANA_PASSWORD=secure_grafana_password

# Real-time Features
REALTIME_ENABLED=true
LOCATION_TRACKING_ENABLED=true
COMMUNICATION_ENABLED=true
PERFORMANCE_DASHBOARD_ENABLED=true
```

### **Installation**
```bash
# Clone repository
git clone https://github.com/esub002/ride-share-app.git
cd ride-share-app/infrastructure

# Copy environment file
cp env.example .env

# Edit environment variables
nano .env

# Start development environment
docker-compose up -d

# Check services
docker-compose ps
```

## 🧪 Testing

### **Infrastructure Testing**
```bash
# Test database connection
docker-compose exec backend npm run test:db

# Test Redis connection
docker-compose exec backend npm run test:redis

# Test real-time features
docker-compose exec backend npm run test:realtime

# Test monitoring
curl http://localhost:9090/api/v1/targets
```

### **Performance Testing**
```bash
# Load testing
docker-compose exec backend npm run test:load

# Stress testing
docker-compose exec backend npm run test:stress

# Real-time performance testing
docker-compose exec backend npm run test:performance
```

## 📊 Performance

### **Target Benchmarks**
- **API Response**: < 200ms average
- **Real-time Latency**: < 100ms
- **Database Queries**: < 50ms average
- **Redis Operations**: < 10ms average
- **WebSocket Connections**: < 50ms setup time

### **Optimization Features**
- **Connection Pooling**: Database and Redis connection pooling
- **Load Balancing**: Nginx load balancing for backend services
- **Caching Strategy**: Multi-layer caching with Redis
- **Real-time Optimization**: WebSocket connection pooling
- **Monitoring**: Comprehensive performance monitoring

## 🔒 Security

### **Infrastructure Security**
- **Network Segmentation**: Separate networks for frontend, backend, and monitoring
- **SSL/TLS**: Secure communication with SSL certificates
- **Environment Variables**: Secure configuration management
- **Access Control**: Role-based access control for services

### **Data Protection**
- **Database Security**: Secure PostgreSQL configuration
- **Redis Security**: Password-protected Redis instances
- **Backup Strategy**: Automated database backups
- **Encryption**: Data encryption at rest and in transit

## 🚀 Deployment

### **Development**
```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### **Production**
```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml up -d

# Monitor deployment
docker-compose -f docker-compose.prod.yml logs -f

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### **Monitoring**
```bash
# Access monitoring dashboards
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3003 (admin/admin)
# Kibana: http://localhost:5601
```

## 📈 Monitoring

### **Performance Monitoring**
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Log aggregation and analysis
- **Real-time Alerts**: Instant performance notifications

### **Infrastructure Metrics**
- **System Resources**: CPU, memory, and disk usage
- **Service Health**: Backend, database, and Redis health
- **Network Performance**: Latency and throughput
- **Real-time Performance**: Live performance metrics

## 🔧 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
- Check PostgreSQL container is running
- Verify database credentials in .env
- Check network connectivity between services
- Verify database initialization scripts

#### **Redis Connection Issues**
- Check Redis container is running
- Verify Redis password configuration
- Check network connectivity
- Verify Redis persistence configuration

#### **Real-time Communication Issues**
- Check WebSocket proxy configuration in Nginx
- Verify Socket.IO server is running
- Check Redis adapter configuration
- Verify real-time service configuration

### **Debug Commands**
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f backend

# Check network connectivity
docker-compose exec backend ping postgres

# Test database connection
docker-compose exec backend npm run test:db

# Check Redis connection
docker-compose exec backend npm run test:redis
```

## 📞 Support

### **Documentation**
- [Backend Setup](../backend/README.md)
- [Driver App Setup](../apps/driver-app/README.md)
- [Admin Dashboard Setup](../admin-dashboard/README.md)
- [Real-time Development Plan](../backend/REALTIME_DEVELOPMENT_PLAN.md)
- [Implementation Guide](../backend/REALTIME_IMPLEMENTATION_GUIDE.md)

### **Quick Help**
- **Infrastructure Issues**: Check Docker Compose configuration
- **Database Issues**: Check PostgreSQL configuration and logs
- **Redis Issues**: Check Redis configuration and logs
- **Monitoring Issues**: Check Prometheus and Grafana configuration

---

## 🎯 Key Features

✅ **Complete Docker Setup**: Development and production environments
✅ **Real-time Communication**: Socket.IO integration with advanced features
✅ **Advanced Location Tracking**: GPS and geofencing with real-time updates
✅ **Enhanced Communication**: Voice/video calls and advanced messaging
✅ **Real-time Performance Dashboard**: Live performance metrics
✅ **Safety Features**: Emergency alerts and monitoring with backend integration
✅ **Comprehensive APIs**: RESTful endpoints for all features
✅ **Performance Optimization**: Fast and scalable architecture
✅ **Security Implementation**: Production-ready security
✅ **Monitoring**: Complete observability stack with real-time dashboards
✅ **Enhanced Real-time Manager**: Advanced real-time communication system
✅ **Voice/Video Communication**: Integrated calling and messaging features

---

**The Infrastructure provides a comprehensive solution for ride-sharing platform deployment with emphasis on real-time communication, safety, and performance. The enhanced real-time features, advanced location tracking, and comprehensive communication system ensure a modern, scalable infrastructure for ride-sharing services.** 