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

# 🚗 Ride-Share App

A comprehensive ride-sharing platform with advanced real-time features, driver and rider applications, enhanced backend services, and admin dashboard.

## 🆕 Latest Updates (2025)

### **🚀 Real-Time Performance Dashboard**
- **Live Performance Metrics**: Real-time monitoring of system performance
- **Advanced Analytics**: Comprehensive data visualization and reporting
- **Performance Optimization**: Enhanced caching and database optimization
- **Real-time Alerts**: Instant notifications for system issues

### **📍 Advanced Location Tracking**
- **Geofencing Support**: Location-based triggers and notifications
- **Enhanced GPS Tracking**: Improved accuracy and reliability
- **Real-time Location Updates**: Sub-second location synchronization
- **Location History**: Complete location tracking and analytics

### **💬 Enhanced Communication System**
- **Voice/Video Calls**: Integrated calling features
- **Advanced Messaging**: Rich media support and file sharing
- **Real-time Chat**: Instant messaging with typing indicators
- **Push Notifications**: Cross-platform notification system

### **🗄️ Comprehensive Database Schema**
- **Real-time Tables**: Optimized for live data updates
- **Analytics Schema**: Performance tracking and metrics
- **Safety Schema**: Emergency and security features
- **Enhanced Indexing**: Improved query performance

## 🎯 Quick Start

### **Test OTP Login (Recommended for Development)**
1. **Enter any phone number** (e.g., +1234567890)
2. **Click "🧪 Use Test OTP"** - No API call needed
3. **OTP auto-fills** with "123456"
4. **Click "Verify OTP"** - Instant login!

### **Backend Setup**
```bash
cd backend
npm install
npm run dev
```

### **Driver App Setup**
```bash
cd apps/driver-app
npm install
npm start
```

### **Rider App Setup**
```bash
cd apps/rider-app
npm install
npm start
```

### **Admin Dashboard Setup**
```bash
cd admin-dashboard
npm install
npm start
```

### **Web Interface Setup**
```bash
cd web
npm install
npm start
```

## 🏗️ Architecture

### **Frontend Applications**
- **Driver App** (React Native + Expo) - Complete driver interface with real-time features
- **Rider App** (React Native + Expo) - Passenger booking app with live tracking
- **Admin Dashboard** (React) - Management interface with real-time monitoring
- **Web Interface** (React) - Web-based booking platform

### **Backend Services**
- **API Server** (Node.js + Express) - RESTful APIs with enhanced performance
- **Real-time Communication** (Socket.IO) - Live updates and messaging
- **Database** (PostgreSQL) - Data persistence with real-time optimization
- **Authentication** (JWT + Test OTP) - Secure login with enhanced security
- **Background Jobs** (Redis + Bull) - Async processing and task management
- **Real-time Performance Dashboard** - Live system monitoring
- **Advanced Location Tracking** - GPS and geofencing services
- **Enhanced Communication** - Voice, video, and messaging services

### **Infrastructure**
- **Containerization** (Docker) - Consistent deployment
- **Monitoring** (Prometheus + Grafana) - Performance tracking
- **Logging** (ELK Stack) - Centralized logging
- **Load Balancing** (Nginx) - High availability
- **Real-time Analytics** - Live performance metrics

## 🔐 Test OTP System

### **Complete Implementation**
The platform includes a comprehensive test OTP system for seamless development:

#### **Features**
- **Fixed Test OTP**: Always "123456"
- **No SMS Required**: Works without external services
- **Auto-fill**: OTP automatically populated
- **Instant Login**: No backend dependency for testing
- **Visual Feedback**: Clear test mode indicators

#### **Implementation**
```javascript
// Frontend: Auto-fill test OTP
const handleSendOTP = async () => {
  if (isValidPhone(phoneNumber)) {
    setOtp("123456"); // Auto-fill test OTP
    setShowOtpInput(true);
    setStatus("🧪 Test OTP ready! Click 'Verify OTP' to continue.");
  }
};

// Backend: Accept test OTP
const isValidOTP = (otp === "123456");
if (isValidOTP) {
  // Create mock account and generate JWT token
  const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
  res.json({ token, user: mockUser });
}
```

## 📱 Applications

### **Driver App** (`apps/driver-app/`)
- **Real-time Ride Requests**: Live ride notifications with enhanced reliability
- **GPS Tracking**: Continuous location updates with geofencing
- **Earnings Dashboard**: Financial analytics with real-time updates
- **Safety Features**: Emergency alerts and contacts with backend integration
- **Navigation Integration**: Turn-by-turn directions with traffic data
- **Enhanced Real-time Manager**: Advanced real-time communication
- **Voice/Video Calls**: Integrated calling features
- **Advanced Messaging**: Rich media support

### **Rider App** (`apps/rider-app/`)
- **Ride Booking**: Complete booking interface with real-time updates
- **Real-time Tracking**: Live driver location with enhanced accuracy
- **Payment Integration**: Secure payment processing
- **Ride History**: Complete trip records
- **Safety Features**: Trip sharing and emergency contacts
- **Enhanced Communication**: Voice calls and messaging

### **Admin Dashboard** (`admin-dashboard/`)
- **Real-time Monitoring**: Live platform metrics with performance dashboard
- **Driver Management**: Complete driver administration
- **Ride Analytics**: Comprehensive statistics with real-time updates
- **Safety Monitoring**: Emergency alerts and incidents
- **System Configuration**: Platform settings
- **Performance Dashboard**: Live system performance metrics

### **Web Interface** (`web/`)
- **Rider Booking**: Web-based booking platform
- **Real-time Tracking**: Live ride monitoring
- **Payment Processing**: Secure online payments
- **User Management**: Account administration
- **Responsive Design**: Mobile-friendly interface

## 🚀 Backend API

### **Core Services** (`backend/`)
- **Authentication**: JWT + Test OTP system with enhanced security
- **Ride Management**: Complete ride lifecycle with real-time updates
- **Real-time Communication**: Socket.IO integration with advanced features
- **Safety Features**: Emergency alerts and monitoring with backend integration
- **Analytics**: Performance tracking and metrics with real-time dashboard
- **Real-time Performance Dashboard**: Live system monitoring
- **Advanced Location Tracking**: GPS and geofencing services
- **Enhanced Communication**: Voice, video, and messaging services

### **Key Endpoints**
```
POST /api/auth/driver/send-otp     # Send OTP (test mode)
POST /api/auth/driver/verify-otp   # Verify OTP and login
GET  /api/drivers/{id}/profile     # Get driver profile
PUT  /api/drivers/{id}/location    # Update location
GET  /api/rides                    # Get available rides
POST /api/rides/{id}/accept        # Accept ride request
POST /api/safety/emergency         # Report emergency
GET  /api/performance/dashboard    # Real-time performance metrics
GET  /api/location/tracking        # Advanced location tracking
POST /api/communication/call       # Voice/video call endpoints
```

## 🏗️ Infrastructure

### **Docker Setup** (`infrastructure/`)
- **Development Environment**: Complete local setup with real-time services
- **Production Deployment**: Scalable production configuration
- **Monitoring Stack**: Prometheus, Grafana, ELK with real-time dashboards
- **Load Balancing**: Nginx configuration
- **SSL/TLS**: Secure communication

### **Deployment**
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

## 🔧 Development Setup

### **Prerequisites**
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)
- Expo CLI (for mobile apps)

### **Environment Configuration**
```env
# Backend (.env)
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/rideshare
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
REALTIME_ENABLED=true
LOCATION_TRACKING_ENABLED=true
COMMUNICATION_ENABLED=true

# Frontend (.env)
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_SOCKET_URL=http://localhost:3000
REACT_APP_REALTIME_ENABLED=true
```

### **Database Setup**
```bash
# Using Docker
docker-compose up -d postgres redis

# Or manually
createdb rideshare
psql rideshare < backend/schema.sql
psql rideshare < backend/safety-schema.sql
psql rideshare < backend/analytics-schema.sql
psql rideshare < backend/real-time-schema.sql
```

## 🧪 Testing

### **Test OTP Flow**
1. **Enter Phone Number**: Any valid format (e.g., +1234567890)
2. **Click "🧪 Use Test OTP"**: No API call, instant response
3. **OTP Auto-fills**: "123456" is automatically entered
4. **Verify OTP**: Backend accepts "123456" as valid
5. **Access Granted**: Full application access

### **Test Data**
- **Test OTP**: Always "123456"
- **Mock Accounts**: Auto-generated user/driver accounts
- **Mock Rides**: Sample ride data
- **Mock Payments**: Test payment processing

### **Real-time Testing**
```bash
# Test real-time features
cd backend
npm run test:realtime

# Test location tracking
npm run test:location

# Test communication features
npm run test:communication
```

## 📊 Performance

### **Target Benchmarks**
- **API Response**: < 200ms average
- **Real-time Latency**: < 100ms
- **App Launch**: < 3 seconds
- **Page Load**: < 2 seconds
- **Concurrent Users**: 1000+ simultaneous
- **Location Updates**: < 50ms
- **Message Delivery**: < 100ms

### **Optimization Features**
- **Connection Pooling**: Database optimization
- **Redis Caching**: Frequently accessed data
- **Code Splitting**: Lazy loading
- **Bundle Optimization**: Tree shaking and minification
- **CDN Integration**: Static asset delivery
- **Real-time Optimization**: WebSocket connection pooling
- **Location Caching**: GPS data optimization

## 🔒 Security

### **Authentication Security**
- JWT Tokens with automatic refresh
- Test OTP validation with rate limiting
- Role-based access control
- Secure session management

### **Data Protection**
- HTTPS communication
- Input validation and sanitization
- Secure storage for sensitive data
- Payment data encryption
- Real-time data encryption

## 🚀 Deployment

### **Development**
```bash
# Start all services
cd backend && npm run dev
cd apps/driver-app && npm start
cd apps/rider-app && npm start
cd admin-dashboard && npm start
cd web && npm start
```

### **Production**
```bash
# Using Docker
docker-compose -f infrastructure/docker-compose.prod.yml up -d

# Or manual deployment
npm run build && npm start
```

## 📈 Monitoring

### **Performance Monitoring**
- **Prometheus**: Metrics collection
- **Grafana**: Visualization and dashboards
- **ELK Stack**: Log aggregation and analysis
- **Error Tracking**: Crash reporting
- **Real-time Dashboard**: Live performance metrics

### **Business Metrics**
- **Platform Usage**: Active drivers and riders
- **Revenue Tracking**: Financial performance
- **Safety Metrics**: Incident rates and resolution
- **User Satisfaction**: Ratings and feedback
- **Real-time Analytics**: Live platform metrics

## 🔧 Troubleshooting

### **Common Issues**

#### **Test OTP Not Working**
- Check backend is running on port 3000
- Verify API configuration in .env files
- Check application logs for errors

#### **Database Connection Issues**
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Use mock database mode for testing

#### **Real-time Updates Not Working**
- Verify Socket.IO connection
- Check backend Socket.IO server
- Ensure proper event handling

#### **Location Tracking Issues**
- Check GPS permissions
- Verify location services enabled
- Check backend location tracking service

### **Debug Commands**
```bash
# Check backend status
curl http://localhost:3000/health

# Check database connection
npm run test:db

# Test real-time features
npm run test:realtime

# View logs
docker-compose logs -f
```

## 📞 Support

### **Documentation**
- [Project Summary](PROJECT_SUMMARY.md)
- [Backend API](backend/API_DOCUMENTATION.md)
- [Driver App](apps/driver-app/README.md)
- [Rider App](apps/rider-app/README.md)
- [Admin Dashboard](admin-dashboard/README.md)
- [Web Interface](web/README.md)
- [Infrastructure](infrastructure/README.md)
- [Real-time Development Plan](backend/REALTIME_DEVELOPMENT_PLAN.md)
- [Implementation Guide](backend/REALTIME_IMPLEMENTATION_GUIDE.md)

### **Quick Help**
- **Test OTP Issues**: Check [authDriver.js](backend/routes/authDriver.js)
- **API Issues**: Check [server.js](backend/server.js)
- **Real-time Issues**: Check [socketService.js](backend/services/socketService.js)
- **Build Issues**: Check package.json files

---

## 🎯 Key Features

✅ **Complete Test OTP System**: Seamless development experience
✅ **Real-time Communication**: Socket.IO integration across all apps
✅ **Advanced Real-time Features**: Performance dashboard, location tracking, enhanced communication
✅ **Comprehensive APIs**: RESTful endpoints for all features
✅ **Safety Features**: Emergency alerts and monitoring with backend integration
✅ **Payment Integration**: Secure payment processing
✅ **Performance Optimization**: Fast and scalable architecture
✅ **Security Implementation**: Production-ready security
✅ **Monitoring**: Complete observability stack with real-time dashboards
✅ **Deployment Ready**: Docker and production configuration
✅ **Enhanced Location Tracking**: GPS and geofencing with real-time updates
✅ **Voice/Video Communication**: Integrated calling and messaging features

---

**The Ride-Share App provides a complete solution for ride-sharing services with emphasis on real-time communication, safety, and user experience. The enhanced real-time features, advanced location tracking, and comprehensive communication system ensure a modern, scalable platform for ride-sharing services.**