# Ride Share API Documentation

## 🚀 Overview

The Ride Share API provides a comprehensive backend for a ride-sharing application with real-time features, security, and analytics.

## 📋 Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 📚 API Endpoints

### 🔑 Authentication Endpoints

#### User Authentication

**POST** `/api/auth/user/register`
- Register a new user account
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123",
    "phone": "+1234567890"
  }
  ```

**POST** `/api/auth/user/login`
- Login with email and password
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```

**POST** `/api/auth/user/verify-email`
- Verify email address with token
- **Body:**
  ```json
  {
    "token": "verification_token_here"
  }
  ```

**POST** `/api/auth/user/forgot-password`
- Request password reset
- **Body:**
  ```json
  {
    "email": "john@example.com"
  }
  ```

**POST** `/api/auth/user/reset-password`
- Reset password with token
- **Body:**
  ```json
  {
    "token": "reset_token_here",
    "newPassword": "newpassword123"
  }
  ```

#### Driver Authentication

**POST** `/api/auth/driver/register`
- Register a new driver account
- **Body:**
  ```json
  {
    "name": "Jane Driver",
    "email": "jane@example.com",
    "password": "securepassword123",
    "phone": "+1234567891",
    "carInfo": "Toyota Prius 2020",
    "licenseNumber": "DL123456789"
  }
  ```

**POST** `/api/auth/driver/login`
- Login driver with email and password
- **Body:**
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```

### 🔄 Token Management

**POST** `/api/auth/refresh`
- Refresh JWT token
- **Body:**
  ```json
  {
    "refreshToken": "your_refresh_token_here"
  }
  ```

**POST** `/api/auth/logout`
- Logout and invalidate tokens
- **Headers:** `Authorization: Bearer <token>`

### 👤 User Management

**GET** `/api/users/profile`
- Get user profile
- **Headers:** `Authorization: Bearer <token>`

**PUT** `/api/users/profile`
- Update user profile
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "name": "Updated Name",
    "phone": "+1234567890"
  }
  ```

**GET** `/api/users/rides`
- Get user's ride history
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `status` (string): Filter by status

### 🚗 Driver Management

**GET** `/api/drivers/profile`
- Get driver profile
- **Headers:** `Authorization: Bearer <token>`

**PUT** `/api/drivers/profile`
- Update driver profile
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "name": "Updated Driver Name",
    "carInfo": "Updated Car Info",
    "licenseNumber": "Updated License"
  }
  ```

**POST** `/api/drivers/availability`
- Update driver availability
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "available": true,
    "location": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  }
  ```

**GET** `/api/drivers/rides`
- Get driver's ride history
- **Headers:** `Authorization: Bearer <token>`

### 🚕 Ride Management

**POST** `/api/rides/request`
- Request a new ride
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "pickup": "123 Main St, New York, NY",
    "destination": "456 Broadway, New York, NY",
    "estimatedFare": 25.50,
    "paymentMethod": "credit_card"
  }
  ```

**GET** `/api/rides/:rideId`
- Get ride details
- **Headers:** `Authorization: Bearer <token>`

**PUT** `/api/rides/:rideId/status`
- Update ride status
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "status": "in_progress"
  }
  ```

**POST** `/api/rides/:rideId/complete`
- Complete a ride
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "actualFare": 28.00,
    "rating": 5,
    "review": "Great ride!"
  }
  ```

### 🚨 Safety Features

**POST** `/api/safety/emergency`
- Report emergency
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
  ```json
  {
    "rideId": 123,
    "emergencyType": "medical",
    "location": "123 Main St, New York, NY",
    "description": "Rider feeling unwell"
  }
  ```

**GET** `/api/safety/incidents`
- Get safety incidents
- **Headers:** `Authorization: Bearer <token>`

### 📊 Analytics (Admin Only)

**GET** `/api/analytics/overview`
- Get analytics overview
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `startDate` (string): Start date (YYYY-MM-DD)
  - `endDate` (string): End date (YYYY-MM-DD)

**GET** `/api/analytics/rides`
- Get ride analytics
- **Headers:** `Authorization: Bearer <token>`

**GET** `/api/analytics/revenue`
- Get revenue analytics
- **Headers:** `Authorization: Bearer <token>`

### 👨‍💼 Admin Endpoints

**GET** `/api/admin/users`
- Get all users (admin only)
- **Headers:** `Authorization: Bearer <token>`

**GET** `/api/admin/drivers`
- Get all drivers (admin only)
- **Headers:** `Authorization: Bearer <token>`

**GET** `/api/admin/rides`
- Get all rides (admin only)
- **Headers:** `Authorization: Bearer <token>`

## 🔌 Real-time Socket.IO Events

### Connection
```javascript
// Connect with authentication
const socket = io('http://localhost:3000', {
  auth: { token: 'your_jwt_token' }
});
```

### Driver Events

**Emit: `driver:available`**
- Mark driver as available
```javascript
socket.emit('driver:available', {});
```

**Emit: `driver:unavailable`**
- Mark driver as unavailable
```javascript
socket.emit('driver:unavailable', {});
```

**Emit: `location:update`**
- Update driver location
```javascript
socket.emit('location:update', {
  latitude: 40.7128,
  longitude: -74.0060,
  accuracy: 10,
  speed: 25,
  heading: 90
});
```

**Listen: `ride:request`**
- Receive ride request
```javascript
socket.on('ride:request', (data) => {
  console.log('New ride request:', data);
});
```

**Emit: `ride:accept`**
- Accept ride request
```javascript
socket.emit('ride:accept', { rideId: 123 });
```

### Rider Events

**Emit: `ride:request`**
- Request a ride
```javascript
socket.emit('ride:request', {
  pickup: '123 Main St',
  destination: '456 Broadway',
  estimatedFare: 25.50,
  paymentMethod: 'credit_card'
});
```

**Listen: `ride:accepted`**
- Receive ride acceptance
```javascript
socket.on('ride:accepted', (data) => {
  console.log('Ride accepted:', data);
});
```

**Listen: `driver:status`**
- Receive driver status updates
```javascript
socket.on('driver:status', (data) => {
  console.log('Driver status:', data);
});
```

### Messaging Events

**Emit: `message:send`**
- Send message
```javascript
socket.emit('message:send', {
  rideId: 123,
  message: 'Hello! I\'m on my way.',
  messageType: 'text'
});
```

**Listen: `message:received`**
- Receive message
```javascript
socket.on('message:received', (data) => {
  console.log('Message received:', data);
});
```

**Emit: `typing:start`**
- Start typing indicator
```javascript
socket.emit('typing:start', { rideId: 123 });
```

**Listen: `typing:start`**
- Receive typing indicator
```javascript
socket.on('typing:start', (data) => {
  console.log('User is typing:', data);
});
```

### Emergency Events

**Emit: `emergency:alert`**
- Send emergency alert
```javascript
socket.emit('emergency:alert', {
  rideId: 123,
  emergencyType: 'medical',
  location: '123 Main St, New York, NY',
  description: 'Rider feeling unwell'
});
```

**Listen: `emergency:alert`** (Admin only)
- Receive emergency alerts
```javascript
socket.on('emergency:alert', (data) => {
  console.log('Emergency alert:', data);
});
```

### Utility Events

**Emit: `heartbeat`**
- Send heartbeat
```javascript
socket.emit('heartbeat');
```

**Listen: `heartbeat:ack`**
- Receive heartbeat acknowledgment
```javascript
socket.on('heartbeat:ack', () => {
  console.log('Heartbeat acknowledged');
});
```

## 📝 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {}
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "pages": 10
    }
  }
}
```

## 🔒 Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` - Insufficient permissions
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Internal server error

## 📊 Rate Limits

- **Authentication endpoints:** 5 requests per 15 minutes
- **API endpoints:** 100 requests per 15 minutes
- **Admin endpoints:** 1000 requests per 15 minutes

## 🛠️ Testing

### Health Check
**GET** `/health`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": {
    "status": "connected"
  }
}
```

### Test Endpoints (Development Only)
**GET** `/api/dev/mock-data` - Get mock data
**POST** `/api/dev/reset` - Reset mock data
**GET** `/api/dev/test-auth` - Test authentication

## 📚 Additional Resources

- [Security Documentation](./SECURITY_README.md)
- [Real-time Testing Guide](./REALTIME_TESTING.md)
- [Analytics Documentation](./ANALYTICS_README.md)
- [Quick Start Guide](./QUICK_START.md) 