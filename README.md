[![CI/CD](https://github.com/esub002/ride-share-app/actions/workflows/ci.yml/badge.svg)](https://github.com/esub002/ride-share-app/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-18.x-brightgreen.svg)](https://nodejs.org/)
[![Issues](https://img.shields.io/github/issues/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/issues)
[![Pull Requests](https://img.shields.io/github/issues-pr/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/pulls)
[![Last Commit](https://img.shields.io/github/last-commit/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/commits/main)
[![Contributors](https://img.shields.io/github/contributors/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/graphs/contributors)
[![GitHub stars](https://img.shields.io/github/stars/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/esub002/ride-share-app.svg)](https://github.com/esub002/ride-share-app/network)
![React](https://img.shields.io/badge/frontend-React-blue)
![React Native](https://img.shields.io/badge/mobile-React%20Native-blue)
![Express](https://img.shields.io/badge/backend-Express-green)
![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue)
![Socket.IO](https://img.shields.io/badge/realtime-Socket.IO-orange)
![Docker](https://img.shields.io/badge/deployment-Docker-blue)
![Redis](https://img.shields.io/badge/cache-Redis-red)
![Prisma](https://img.shields.io/badge/orm-Prisma-purple)

# 🚗 Ride Share Application

A comprehensive, production-ready ride-sharing platform with real-time features, advanced safety systems, and multi-platform support.

## 🌟 Overview

This is a full-stack ride-sharing application featuring:
- **React Native Driver App** with advanced safety features and real-time ride management
- **React Web Frontend** for riders with modern UI and real-time updates
- **Express.js Backend** with REST APIs, Socket.IO real-time communication, and comprehensive safety features
- **PostgreSQL Database** with Prisma ORM for data management
- **Redis Caching** and BullMQ for background job processing
- **Docker** containerization with production-ready deployment
- **ELK Stack** for comprehensive logging and monitoring
- **CI/CD Pipeline** with GitHub Actions

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Driver App    │    │  Web Frontend   │    │   Rider App     │
│  (React Native) │    │    (React)      │    │  (React Native) │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │      Load Balancer        │
                    │        (Nginx)            │
                    └─────────────┬─────────────┘
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

## 🚀 Key Features

### 🛡️ Advanced Safety System
- **Emergency SOS** with real-time alert broadcasting
- **Trip sharing** with emergency contacts
- **Voice commands** for hands-free operation
- **Driver verification** with document upload
- **Incident reporting** and tracking
- **Real-time location tracking** with safety monitoring
- **Emergency contact management**

### 💰 Business Features
- **Real-time ride requests** with instant notifications
- **Earnings tracking** with detailed analytics
- **Payment processing** with Stripe integration
- **Trip history** with comprehensive records
- **Driver/rider ratings** and reviews
- **Multi-period earnings reports** (daily/weekly/monthly)

### 🔄 Real-Time Communication
- **Socket.IO** for live updates
- **Push notifications** for ride requests
- **In-app messaging** between drivers and riders
- **Live ride status** updates
- **Real-time location sharing**

### 📊 Analytics & Monitoring
- **ELK Stack** (Elasticsearch, Logstash, Kibana) for logging
- **Prometheus & Grafana** for metrics
- **Performance monitoring** with response time tracking
- **Error tracking** and alerting
- **Business analytics** dashboard

## 🛠️ Technology Stack

### Frontend
- **React 19** with modern hooks and context
- **React Router** for navigation
- **Leaflet** for web maps
- **Socket.IO Client** for real-time features

### Mobile App
- **React Native** with Expo
- **React Navigation** for mobile navigation
- **React Native Maps** for mobile mapping
- **Expo Location** for GPS tracking
- **Expo Notifications** for push alerts

### Backend
- **Node.js** with Express.js
- **Socket.IO** for real-time communication
- **JWT Authentication** with refresh tokens
- **Prisma ORM** for database operations
- **BullMQ** for background job processing
- **Redis** for caching and session storage
- **Winston** for structured logging

### Database
- **PostgreSQL** as primary database
- **Redis** for caching and real-time data
- **Prisma** for type-safe database queries

### Infrastructure
- **Docker** for containerization
- **Docker Compose** for local development
- **Nginx** for load balancing
- **ELK Stack** for logging and monitoring
- **GitHub Actions** for CI/CD

## 📁 Project Structure

```
ride-share-app-main/
├── apps/
│   ├── driver-app/           # React Native driver application
│   │   ├── components/       # Reusable UI components
│   │   ├── screens/          # Screen components
│   │   ├── utils/            # Utility functions
│   │   ├── auth/             # Authentication logic
│   │   └── assets/           # Images and fonts
│   └── rider-app/            # React Native rider application
├── backend/                  # Express.js backend server
│   ├── routes/               # API route handlers
│   ├── middleware/           # Express middleware
│   ├── services/             # Business logic services
│   ├── workers/              # Background job workers
│   ├── utils/                # Utility functions
│   ├── sockets/              # Socket.IO event handlers
│   └── monitoring/           # ELK stack configuration
├── frontend/                 # React web frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Page components
│   │   └── utils/            # Utility functions
├── infrastructure/           # Docker and deployment configs
│   ├── docker-compose.yml    # Development environment
│   ├── nginx.conf           # Load balancer config
│   └── monitoring/          # Prometheus & Grafana configs
└── scripts/                 # Deployment and utility scripts
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **Docker** and Docker Compose
- **PostgreSQL** (or use Docker)
- **Redis** (or use Docker)
- **Expo CLI** (for mobile development)

### 1. Clone and Setup
```bash
git clone https://github.com/esub002/ride-share-app.git
cd ride-share-app
```

### 2. Backend Setup
```bash
cd backend
npm install
cp env.example .env
# Edit .env with your configuration
npm run dev
```

### 3. Database Setup
```bash
# Using Docker (recommended)
cd infrastructure
docker-compose up -d

# Or manually setup PostgreSQL and run:
psql < backend/schema.sql
psql < backend/safety-schema.sql
psql < backend/analytics-schema.sql
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 5. Mobile App Setup
```bash
cd apps/driver-app
npm install
npx expo start
```

## 🔧 Configuration

### Environment Variables
Key environment variables to configure:

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rideshare
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Maps
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Payment
STRIPE_SECRET_KEY=your-stripe-secret-key
```

### Production Deployment
```bash
# Using Docker Compose
cd backend
docker-compose -f docker-compose.prod.yml up -d

# Or using deployment script
./scripts/deploy.sh
```

## 📊 Monitoring & Logging

### ELK Stack Setup
The application includes a complete ELK stack for logging:

```bash
# Start ELK stack
cd backend
docker-compose -f docker-compose.prod.yml up elasticsearch kibana fluentd
```

### Kibana Dashboard
Import the advanced dashboard from `backend/monitoring/kibana-advanced-dashboard.ndjson` for comprehensive monitoring.

### Metrics & Alerts
- **Prometheus** for metrics collection
- **Grafana** for visualization
- **ElastAlert** for error and performance alerts

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test                    # Run all tests
npm run test:coverage       # Run with coverage
npm run test:watch          # Watch mode
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Mobile App Tests
```bash
cd apps/driver-app
npm test
```

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Rate limiting** and DDoS protection
- **Input validation** and sanitization
- **CORS** configuration
- **Helmet** security headers
- **Password policies** and encryption
- **Session management** with Redis
- **API key authentication** for external services

## 📈 Performance Features

- **Redis caching** for frequently accessed data
- **Database connection pooling**
- **Background job processing** with BullMQ
- **Compression middleware** for API responses
- **Static file serving** optimization
- **Database query optimization** with Prisma

## 🚨 Safety & Emergency Features

### Driver Safety
- **Emergency SOS button** with instant alert broadcasting
- **Trip sharing** with emergency contacts
- **Voice commands** for hands-free operation
- **Driver verification** with document upload
- **Incident reporting** system

### Real-Time Monitoring
- **Live location tracking**
- **Emergency alert system**
- **Safety metrics** tracking
- **Communication history** logging

## 🔄 Real-Time Features

### Socket.IO Events
- **Ride requests** and acceptance
- **Location updates** in real-time
- **Chat messages** between drivers and riders
- **Emergency alerts** broadcasting
- **Trip status** updates

### Background Jobs
- **Email notifications** processing
- **Payment processing** with retry logic
- **Analytics data** aggregation
- **Database cleanup** and maintenance

## 📱 Mobile App Features

### Driver App
- **Real-time ride requests** with notifications
- **Earnings tracking** and analytics
- **Safety features** with emergency contacts
- **Navigation integration** with maps
- **Profile management** and settings

### Rider App
- **Ride booking** with real-time tracking
- **Payment management** and history
- **Driver communication** via chat
- **Trip history** and ratings

## 🌐 Web Frontend Features

- **Modern responsive design** with dark/light themes
- **Real-time ride tracking** with maps
- **User authentication** with email/phone
- **Driver/rider dashboards** with analytics
- **Payment integration** with Stripe

## 🚀 Deployment

### Development
```bash
# Start all services
cd infrastructure
docker-compose up -d

# Start backend
cd backend
npm run dev

# Start frontend
cd frontend
npm start

# Start mobile app
cd apps/driver-app
npx expo start
```

### Production
```bash
# Deploy with Docker
cd backend
docker-compose -f docker-compose.prod.yml up -d

# Or use deployment script
./scripts/deploy.sh
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check the individual README files in each directory
- **Issues**: [GitHub Issues](https://github.com/esub002/ride-share-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/esub002/ride-share-app/discussions)

## 🏆 Recent Achievements

- ✅ **Production-ready backend** with comprehensive safety features
- ✅ **Real-time communication** with Socket.IO and Redis
- ✅ **Advanced monitoring** with ELK stack and Prometheus
- ✅ **Mobile apps** for both drivers and riders
- ✅ **CI/CD pipeline** with automated testing and deployment
- ✅ **Security hardening** with JWT, rate limiting, and encryption
- ✅ **Performance optimization** with caching and background jobs
- ✅ **Comprehensive testing** with Jest and Supertest

---

**Built with ❤️ for the ride-sharing community**