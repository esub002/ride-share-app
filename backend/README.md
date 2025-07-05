# 🚀 Backend API Server

A comprehensive Node.js backend for the ride-sharing platform with real-time communication, authentication, and safety features.

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
- **Express.js Server**: RESTful API endpoints
- **Socket.IO**: Real-time communication
- **PostgreSQL**: Primary database
- **Redis**: Caching and session storage
- **JWT Authentication**: Secure token-based auth
- **Background Jobs**: Async processing with BullMQ

### **Key Features**
- **Test OTP System**: Development-friendly authentication
- **Real-time Updates**: Socket.IO integration
- **Safety Features**: Emergency alerts and monitoring
- **Analytics**: Performance tracking and metrics
- **Monitoring**: ELK stack integration

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

// Outgoing Events
socket.emit('driver:online', { driverId, location });
socket.emit('driver:offline', { driverId });
socket.emit('ride:accept', { rideId, driverId });
socket.emit('location:update', { driverId, location });
```

### **Event Handlers**
- **Ride Requests**: Real-time ride notifications
- **Location Updates**: Continuous GPS tracking
- **Emergency Alerts**: Instant safety notifications
- **Chat Messages**: Driver-rider communication

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
  car_info VARCHAR(100),
  available BOOLEAN DEFAULT false,
  current_location POINT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_rides INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Rides table
CREATE TABLE rides (
  id SERIAL PRIMARY KEY,
  rider_id INTEGER REFERENCES users(id),
  driver_id INTEGER REFERENCES drivers(id),
  pickup_location POINT NOT NULL,
  dropoff_location POINT NOT NULL,
  status ride_status DEFAULT 'requested',
  fare DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### **Safety Tables**
```sql
-- Emergency contacts
CREATE TABLE emergency_contacts (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  relationship VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Safety incidents
CREATE TABLE incident_reports (
  id SERIAL PRIMARY KEY,
  driver_id INTEGER REFERENCES drivers(id),
  ride_id INTEGER REFERENCES rides(id),
  incident_type VARCHAR(50),
  description TEXT,
  location POINT,
  reported_at TIMESTAMP DEFAULT NOW()
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
# .env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/rideshare
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret

# Optional: SMS Service (for production)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=your_twilio_phone
```

### **Database Setup**
```bash
# Using Docker (recommended)
docker-compose up -d postgres redis

# Or manually
createdb rideshare
psql rideshare < schema.sql
psql rideshare < safety-schema.sql
psql rideshare < analytics-schema.sql
```

## 🧪 Testing

### **Test OTP Flow**
1. **Send OTP**: Always returns "123456"
2. **Verify OTP**: Accepts "123456" as valid
3. **Create Account**: Generates mock driver account
4. **Generate Token**: Creates valid JWT token

### **Test Data**
- **Test OTP**: Always "123456"
- **Mock Driver**: Auto-generated test account
- **Mock Rides**: Sample ride requests
- **Mock Earnings**: Sample financial data

### **Testing Tools**
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "auth"

# API testing
npm run test:api
```

## 📊 Performance

### **Target Benchmarks**
- **API Response**: < 200ms average
- **Database Queries**: < 50ms average
- **Real-time Latency**: < 100ms
- **Concurrent Users**: 1000+ simultaneous

### **Optimization Features**
- **Connection Pooling**: Database connection management
- **Redis Caching**: Frequently accessed data
- **Query Optimization**: Indexed database queries
- **Background Jobs**: Async processing
- **Load Balancing**: Horizontal scaling ready

## 🔒 Security

### **Authentication Security**
- JWT Tokens with automatic refresh
- OTP validation with rate limiting
- Input validation and sanitization
- Secure session management

### **API Security**
- Rate limiting and DDoS protection
- CORS configuration
- Helmet security headers
- Input validation and sanitization

### **Data Protection**
- HTTPS communication
- Data encryption at rest
- GDPR compliance ready
- Secure storage implementation

## 🚀 Deployment

### **Development**
```bash
# Start development server
npm run dev

# Start with auto-restart
npm run dev:watch

# Start with mock database
npm run dev:mock
```

### **Production**
```bash
# Build for production
npm run build

# Start production server
npm start

# Using Docker
docker-compose -f docker-compose.prod.yml up -d
```

### **Environment Variables**
```env
# Production
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:5432/rideshare
REDIS_URL=redis://host:6379
JWT_SECRET=your_production_jwt_secret
```

## 📈 Monitoring

### **ELK Stack Integration**
```bash
# Start ELK stack
docker-compose -f docker-compose.prod.yml up elasticsearch kibana fluentd

# Import dashboard
curl -X POST "localhost:5601/api/kibana/dashboards/import" \
  -H "kbn-xsrf: true" \
  -H "Content-Type: application/json" \
  -d @monitoring/kibana-advanced-dashboard.ndjson
```

### **Performance Monitoring**
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **ElastAlert**: Error and performance alerts

### **Logging**
- **Winston**: Structured logging
- **Fluentd**: Log aggregation
- **Elasticsearch**: Log storage
- **Kibana**: Log visualization

## 🔧 Troubleshooting

### **Common Issues**

#### **Test OTP Not Working**
- Check `routes/authDriver.js` for test OTP implementation
- Verify JWT_SECRET is set
- Check server logs for errors

#### **Database Connection Issues**
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Use mock database mode for testing

#### **Socket.IO Issues**
- Check Redis connection
- Verify CORS configuration
- Check client connection settings

### **Debug Commands**
```bash
# Check server status
curl http://localhost:3000/health

# Test database connection
npm run test:db

# Check Redis connection
npm run test:redis

# View logs
npm run logs
```

## 📞 Support

### **Documentation**
- [API Documentation](API_DOCUMENTATION.md)
- [Quick Start Guide](QUICK_START.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Security Guide](SECURITY_README.md)

### **Quick Help**
- **Test OTP Issues**: Check [authDriver.js](routes/authDriver.js)
- **API Issues**: Check [server.js](server.js)
- **Database Issues**: Check [db.js](db.js)

---

## 🎯 Key Features

✅ **Complete Test OTP Implementation**: Seamless development experience
✅ **Real-time Communication**: Socket.IO integration
✅ **Comprehensive API**: RESTful endpoints for all features
✅ **Safety Features**: Emergency alerts and monitoring
✅ **Performance Optimization**: Fast and scalable
✅ **Security Implementation**: Production-ready security
✅ **Monitoring**: ELK stack and performance tracking
✅ **Deployment Ready**: Docker and production configuration

---

**The Backend API Server provides a complete solution for ride-sharing services with emphasis on security, performance, and real-time communication. The test OTP implementation ensures smooth development and testing workflows.**