# 🚀 Backend API Server

A comprehensive Node.js backend for the ride-sharing platform with advanced real-time communication, authentication, safety features, and enhanced performance monitoring.

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

### **Test OTP Implementation**
The backend includes a complete test OTP system for development:

#### **Features**
- **Fixed Test OTP**: Always returns "123456"
- **No SMS Required**: Works without external services
- **Mock Driver Creation**: Creates test accounts instantly
- **JWT Authentication**: Generates valid tokens

#### **API Endpoints**
```bash
# Send OTP (Test Mode)
POST /api/auth/driver/send-otp
{
  "phone": "+1234567890"
}
# Response: { "message": "OTP sent successfully", "otp": "123456" }

# Verify OTP (Test Mode)
POST /api/auth/driver/verify-otp
{
  "phone": "+1234567890",
  "otp": "123456"
}
# Response: { "token": "jwt_token", "driver": {...} }
```

### **Setup**
```bash
cd backend
npm install
npm run dev
```

## 🏗️ Architecture

### **Core Services**
- **Express.js Server**: RESTful API endpoints with enhanced performance
- **Socket.IO**: Real-time communication with advanced features
- **PostgreSQL**: Primary database with real-time optimization
- **Redis**: Caching and session storage with enhanced performance
- **JWT Authentication**: Secure token-based auth with enhanced security
- **Background Jobs**: Async processing with BullMQ
- **Real-time Performance Dashboard**: Live system monitoring
- **Advanced Location Tracking**: GPS and geofencing services
- **Enhanced Communication**: Voice, video, and messaging services

### **Key Features**
- **Test OTP System**: Development-friendly authentication
- **Real-time Updates**: Socket.IO integration with advanced features
- **Safety Features**: Emergency alerts and monitoring with backend integration
- **Analytics**: Performance tracking and metrics with real-time dashboard
- **Monitoring**: ELK stack integration with real-time dashboards
- **Advanced Location Tracking**: GPS and geofencing with real-time updates
- **Voice/Video Communication**: Integrated calling and messaging features

## 🔐 Authentication System

### **Test OTP Implementation**
The backend provides a complete test OTP flow:

#### **Send OTP Endpoint**
```javascript
// routes/authDriver.js
router.post('/send-otp', async (req, res) => {
  const { phone } = req.body;
  
  // Always return test OTP for development
  const testOtp = "123456";
  
  res.json({ 
    message: 'OTP sent successfully',
    otp: testOtp // Always "123456"
  });
});
```

#### **Verify OTP Endpoint**
```javascript
// routes/authDriver.js
router.post('/verify-otp', async (req, res) => {
  const { phone, otp, name, car_info } = req.body;
  
  // Accept "123456" as valid OTP
  const isValidOTP = (otp === "123456");
  
  if (isValidOTP) {
    // Create mock driver account
    const mockDriver = {
      id: 'test-driver-' + Date.now(),
      name: name || 'Test Driver',
      phone: phone,
      car_info: car_info || 'Test Car'
    };
    
    // Generate JWT token
    const token = jwt.sign({ 
      driverId: mockDriver.id, 
      role: 'driver',
      phone: mockDriver.phone 
    }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ token, driver: mockDriver });
  }
});
```

### **Production OTP Flow**
- Real SMS delivery via Twilio/AWS SNS
- Secure 6-digit code verification
- Rate limiting and expiration
- Database-backed user accounts

## 🚀 API Endpoints

### **Authentication**
```
POST /api/auth/driver/send-otp     # Send OTP (test mode)
POST /api/auth/driver/verify-otp   # Verify OTP and login
POST /api/auth/user/register       # User registration
POST /api/auth/user/login          # User login
```

### **Driver Operations**
```
GET    /api/drivers/{id}/profile     # Get driver profile
PUT    /api/drivers/{id}/profile     # Update driver profile
PUT    /api/drivers/{id}/location    # Update location
PATCH  /api/drivers/{id}/availability # Toggle availability
GET    /api/drivers/{id}/earnings    # Get earnings data
GET    /api/drivers/{id}/stats       # Get driver statistics
```

### **Ride Management**
```
GET    /api/rides                    # Get available rides
POST   /api/rides/{id}/accept        # Accept ride request
POST   /api/rides/{id}/reject        # Reject ride request
POST   /api/rides/{id}/complete      # Complete ride
PATCH  /api/rides/{id}/status        # Update ride status
```

### **Safety Features**
```
POST   /api/safety/emergency         # Report emergency
POST   /api/safety/share-trip        # Share trip with contacts
GET    /api/safety/contacts          # Get emergency contacts
POST   /api/safety/check-in          # Safety check-in
```

### **Real-time Performance Dashboard**
```
GET    /api/performance/dashboard    # Real-time performance metrics
GET    /api/performance/analytics    # Performance analytics
GET    /api/performance/alerts       # Performance alerts
POST   /api/performance/optimize     # Performance optimization
```

### **Advanced Location Tracking**
```
GET    /api/location/tracking        # Advanced location tracking
POST   /api/location/geofence        # Geofencing operations
GET    /api/location/history         # Location history
POST   /api/location/update          # Update location with enhanced features
```

### **Enhanced Communication**
```
POST   /api/communication/call       # Voice/video call endpoints
POST   /api/communication/message    # Advanced messaging
GET    /api/communication/history    # Communication history
POST   /api/communication/notify     # Push notifications
```

## 🔄 Real-time Communication

### **Socket.IO Events**
```javascript
// Incoming Events
socket.on('ride:request', (data) => {
  // New ride request received
});

socket.on('ride:update', (data) => {
  // Ride status updated
});

socket.on('emergency:alert', (data) => {
  // Emergency notification
});

socket.on('location:update', (data) => {
  // Location update with enhanced features
});

socket.on('communication:call', (data) => {
  // Voice/video call request
});

socket.on('communication:message', (data) => {
  // Advanced messaging
});

// Outgoing Events
socket.emit('driver:online', { driverId, location });
socket.emit('driver:offline', { driverId });
socket.emit('ride:accept', { rideId, driverId });
socket.emit('location:update', { driverId, location });
socket.emit('performance:update', { metrics });
socket.emit('communication:call', { callData });
socket.emit('communication:message', { messageData });
```

### **Event Handlers**
- **Ride Requests**: Real-time ride notifications with enhanced reliability
- **Location Updates**: Continuous GPS tracking with geofencing
- **Emergency Alerts**: Instant safety notifications with backend integration
- **Chat Messages**: Driver-rider communication with rich media support
- **Performance Updates**: Real-time system performance metrics
- **Communication Events**: Voice/video calls and advanced messaging

## 🗄️ Database Schema

### **Core Tables**
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  role user_role DEFAULT 'user',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Drivers table
CREATE TABLE drivers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  car_info JSONB,
  license_number VARCHAR(50),
  vehicle_registration VARCHAR(50),
  insurance_info JSONB,
  rating DECIMAL(3,2) DEFAULT 0.0,
  total_rides INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.0,
  is_online BOOLEAN DEFAULT false,
  current_location POINT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Real-time performance metrics
CREATE TABLE performance_metrics (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  category VARCHAR(50),
  tags JSONB
);

-- Location tracking with enhanced features
CREATE TABLE location_tracking (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id),
  location POINT NOT NULL,
  accuracy DECIMAL(8,6),
  speed DECIMAL(8,2),
  heading DECIMAL(5,2),
  altitude DECIMAL(8,2),
  timestamp TIMESTAMP DEFAULT NOW(),
  geofence_events JSONB
);

-- Enhanced communication history
CREATE TABLE communication_history (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  message_type VARCHAR(20) NOT NULL, -- 'text', 'voice', 'video', 'file'
  content TEXT,
  media_url VARCHAR(500),
  duration INTEGER, -- for voice/video calls
  status VARCHAR(20) DEFAULT 'sent',
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### **Real-time Optimized Tables**
```sql
-- Real-time ride requests with enhanced features
CREATE TABLE realtime_ride_requests (
  id SERIAL PRIMARY KEY,
  rider_id INTEGER REFERENCES users(id),
  pickup_location POINT NOT NULL,
  dropoff_location POINT NOT NULL,
  pickup_address TEXT,
  dropoff_address TEXT,
  estimated_fare DECIMAL(8,2),
  status ride_status DEFAULT 'pending',
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  realtime_data JSONB
);

-- Performance dashboard data
CREATE TABLE performance_dashboard (
  id SERIAL PRIMARY KEY,
  metric_type VARCHAR(50) NOT NULL,
  metric_value DECIMAL(10,4) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  period VARCHAR(20), -- 'minute', 'hour', 'day'
  category VARCHAR(50),
  realtime_alert BOOLEAN DEFAULT false
);
```

## 🔧 Development Setup

### **Prerequisites**
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Docker (optional)

### **Environment Configuration**
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/rideshare
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Real-time Features
REALTIME_ENABLED=true
LOCATION_TRACKING_ENABLED=true
COMMUNICATION_ENABLED=true
PERFORMANCE_DASHBOARD_ENABLED=true

# Performance
CACHE_TTL=3600
MAX_CONNECTIONS=100
CONNECTION_TIMEOUT=30000

# Monitoring
LOG_LEVEL=info
ENABLE_METRICS=true
ENABLE_TRACING=true
```

### **Database Setup**
```bash
# Create database
createdb rideshare

# Run migrations
psql rideshare < schema.sql
psql rideshare < safety-schema.sql
psql rideshare < analytics-schema.sql
psql rideshare < real-time-schema.sql

# Or using Docker
docker-compose up -d postgres redis
```

## 🧪 Testing

### **Test Commands**
```bash
# Run all tests
npm test

# Test specific features
npm run test:auth
npm run test:rides
npm run test:safety
npm run test:realtime
npm run test:location
npm run test:communication
npm run test:performance

# Test database connection
npm run test:db

# Test real-time features
npm run test:socket
```

### **Real-time Testing**
```bash
# Test Socket.IO connection
node test-socket-client.js

# Test location tracking
node test-location-tracking.js

# Test communication features
node test-communication.js

# Test performance dashboard
node test-performance-dashboard.js
```

## 📊 Performance Optimization

### **Database Optimization**
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Indexed queries for fast retrieval
- **Caching Strategy**: Redis caching for frequently accessed data
- **Real-time Indexes**: Optimized indexes for real-time queries

### **Real-time Optimization**
- **WebSocket Connection Pooling**: Efficient Socket.IO connections
- **Event Batching**: Batch real-time events for better performance
- **Location Caching**: Cache GPS data to reduce database load
- **Message Queuing**: Queue non-critical messages for async processing

### **Caching Strategy**
```javascript
// Redis caching for performance
const cacheKey = `driver:${driverId}:location`;
await redis.setex(cacheKey, 300, JSON.stringify(locationData));

// Performance metrics caching
const metricsKey = `performance:${metricType}:${period}`;
await redis.setex(metricsKey, 60, JSON.stringify(metricsData));
```

## 🔒 Security

### **Authentication Security**
- JWT token validation with automatic refresh
- Rate limiting for OTP requests
- Secure session management
- Role-based access control

### **Data Protection**
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure headers

### **Real-time Security**
- WebSocket authentication
- Event validation
- Rate limiting for real-time events
- Secure communication channels

## 🚀 Deployment

### **Development**
```bash
npm run dev
```

### **Production**
```bash
# Using Docker
docker-compose -f docker-compose.prod.yml up -d

# Or manual deployment
npm run build
npm start
```

### **Environment Variables**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/rideshare
REDIS_URL=redis://host:6379
JWT_SECRET=your_production_jwt_secret
```

## 📈 Monitoring

### **Performance Monitoring**
- **Real-time Metrics**: Live performance dashboard
- **Error Tracking**: Comprehensive error logging
- **Resource Monitoring**: CPU, memory, and database monitoring
- **Response Time Tracking**: API response time monitoring

### **Business Metrics**
- **Active Users**: Real-time user activity tracking
- **Ride Metrics**: Ride completion rates and times
- **Revenue Tracking**: Financial performance monitoring
- **Safety Metrics**: Incident tracking and resolution

## 🔧 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
- Check DATABASE_URL configuration
- Verify PostgreSQL is running
- Check connection pool settings
- Use mock database for testing

#### **Real-time Communication Issues**
- Verify Socket.IO server is running
- Check WebSocket connection settings
- Verify event handlers are properly configured
- Check Redis connection for session storage

#### **Performance Issues**
- Monitor database query performance
- Check Redis cache hit rates
- Verify connection pooling settings
- Monitor memory usage

### **Debug Commands**
```bash
# Check server status
curl http://localhost:3000/health

# Check database connection
npm run test:db

# Test real-time features
npm run test:realtime

# View logs
docker-compose logs -f backend
```

## 📞 Support

### **Documentation**
- [API Documentation](API_DOCUMENTATION.md)
- [Security Guide](SECURITY_README.md)
- [Analytics Documentation](ANALYTICS_README.md)
- [Real-time Development Plan](REALTIME_DEVELOPMENT_PLAN.md)
- [Implementation Guide](REALTIME_IMPLEMENTATION_GUIDE.md)

### **Quick Help**
- **Authentication Issues**: Check [authDriver.js](routes/authDriver.js)
- **Real-time Issues**: Check [socketService.js](services/socketService.js)
- **Database Issues**: Check [db.js](config/db.js)
- **Performance Issues**: Check [performance.js](utils/performance.js)

---

## 🎯 Key Features

✅ **Complete Test OTP System**: Seamless development experience
✅ **Real-time Communication**: Socket.IO integration with advanced features
✅ **Advanced Location Tracking**: GPS and geofencing with real-time updates
✅ **Enhanced Communication**: Voice/video calls and advanced messaging
✅ **Real-time Performance Dashboard**: Live system monitoring
✅ **Safety Features**: Emergency alerts and monitoring with backend integration
✅ **Comprehensive APIs**: RESTful endpoints for all features
✅ **Performance Optimization**: Fast and scalable architecture
✅ **Security Implementation**: Production-ready security
✅ **Monitoring**: Complete observability stack with real-time dashboards
✅ **Database Optimization**: Real-time optimized schema and queries
✅ **Deployment Ready**: Docker and production configuration

---

**The Backend API Server provides a comprehensive solution for ride-sharing services with emphasis on real-time communication, safety, and performance. The enhanced real-time features, advanced location tracking, and comprehensive communication system ensure a modern, scalable backend for ride-sharing applications.**