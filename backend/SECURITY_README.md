# 🔐 Security Enhancements for Ride Share App

This document outlines the comprehensive security improvements implemented in the Ride Share App backend.

## 🚀 **What's New**

### **1. Enhanced JWT Authentication**
- ✅ **Proper JWT token validation** with separate access and refresh tokens
- ✅ **Token blacklisting** for secure logout
- ✅ **Role-based access control (RBAC)** with granular permissions
- ✅ **Automatic token refresh** mechanism
- ✅ **Token expiration handling** with proper error codes

### **2. Advanced Security Middleware**
- ✅ **Rate limiting** with different tiers (global, auth, API, upload)
- ✅ **Request validation** and sanitization
- ✅ **Enhanced CORS** configuration
- ✅ **Security headers** (Helmet, CSP, XSS protection)
- ✅ **Input sanitization** to prevent XSS attacks
- ✅ **Request size limiting** to prevent DoS attacks

### **3. Database Security**
- ✅ **Connection pooling** for better performance and security
- ✅ **Prepared statements** to prevent SQL injection
- ✅ **Data encryption** for sensitive information
- ✅ **Audit logging** for compliance and monitoring
- ✅ **Transaction management** with automatic rollback

### **4. API Key Management**
- ✅ **API key validation** for third-party integrations
- ✅ **Rate limiting per API key**
- ✅ **Permission-based access** control
- ✅ **Key expiration** and rotation support

## 📁 **File Structure**

```
backend/
├── middleware/
│   ├── auth.js              # JWT authentication middleware
│   ├── security.js          # Security middleware (rate limiting, validation, etc.)
│   └── database.js          # Database security and connection management
├── config/
│   └── security.js          # Centralized security configuration
├── security-schema.sql      # Database schema for security features
└── SECURITY_README.md       # This file
```

## 🔧 **Setup Instructions**

### **1. Install Dependencies**

```bash
npm install jsonwebtoken bcryptjs express-rate-limit helmet express-validator
```

### **2. Environment Configuration**

Create a `.env` file in the backend directory with the following variables:

```env
# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_this_in_production
JWT_REFRESH_SECRET=your_super_secure_jwt_refresh_secret_key_change_this_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption
ENCRYPTION_KEY=your_32_character_encryption_key_for_sensitive_data

# API Keys
API_KEY_1=your_first_api_key_for_testing
API_KEY_2=your_second_api_key_for_production
API_KEY_3=your_third_api_key_for_backup

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=5
API_RATE_LIMIT_MAX_REQUESTS=1000

# Security Settings
BCRYPT_SALT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
SESSION_TIMEOUT_MINUTES=60
MAX_LOGIN_ATTEMPTS=5
LOGIN_LOCKOUT_DURATION_MINUTES=15
AUDIT_LOG_RETENTION_DAYS=90

# Feature Flags
ENABLE_TWO_FACTOR_AUTH=true
ENABLE_SMS_VERIFICATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
ENABLE_API_KEY_AUTH=true
```

### **3. Database Setup**

Run the security schema to create all necessary tables:

```bash
psql -d ride_share -f security-schema.sql
```

## 🔑 **Usage Examples**

### **1. Authentication**

#### **User Registration**
```javascript
// POST /api/auth/user/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "message": "User registered successfully. Please check your email to verify your account.",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### **User Login**
```javascript
// POST /api/auth/user/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "refreshExpiresIn": 604800,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### **Token Refresh**
```javascript
// POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 900,
  "refreshExpiresIn": 604800
}
```

#### **Logout**
```javascript
// POST /api/auth/logout
// Headers: Authorization: Bearer <accessToken>

// Response
{
  "message": "Logged out successfully"
}
```

### **2. Protected Routes**

#### **User Routes (requires 'user' role)**
```javascript
// GET /api/users/profile
// Headers: Authorization: Bearer <accessToken>

// Response
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user"
}
```

#### **Driver Routes (requires 'driver' role)**
```javascript
// GET /api/drivers/profile
// Headers: Authorization: Bearer <accessToken>

// Response
{
  "id": 1,
  "name": "Jane Driver",
  "email": "jane@example.com",
  "role": "driver",
  "car_info": "Toyota Prius"
}
```

#### **Admin Routes (requires 'admin' role + API key)**
```javascript
// GET /api/admin/users
// Headers: 
//   Authorization: Bearer <accessToken>
//   X-API-Key: <apiKey>

// Response
{
  "users": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  ]
}
```

### **3. API Key Authentication**

```javascript
// For third-party integrations
const response = await fetch('/api/analytics/dashboard', {
  headers: {
    'X-API-Key': 'your_api_key_here',
    'Content-Type': 'application/json'
  }
});
```

## 🛡️ **Security Features**

### **1. Rate Limiting**

The app implements multiple rate limiting tiers:

- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 requests per 15 minutes per IP
- **API Keys**: 1000 requests per minute per API key
- **File Uploads**: 10 uploads per minute per IP

### **2. Input Validation**

All inputs are validated and sanitized:

```javascript
// Example validation rules
const validations = [
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character')
];
```

### **3. Security Headers**

The app sets comprehensive security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### **4. Audit Logging**

All security-relevant actions are logged:

```javascript
// Example audit log entry
{
  "action": "user_login",
  "table_name": "users",
  "user_id": 1,
  "user_role": "user",
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "method": "POST",
  "url": "/api/auth/user/login",
  "status_code": 200,
  "data": {
    "email": "john@example.com"
  },
  "created_at": "2024-01-01T12:00:00Z"
}
```

## 🔍 **Monitoring & Alerts**

### **1. Security Events**

The system tracks security events with severity levels:

- **Low**: Failed login attempts
- **Medium**: Rate limit exceeded
- **High**: Unauthorized access attempts
- **Critical**: Potential security breaches

### **2. Health Checks**

```javascript
// GET /health
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "uptime": 3600,
  "database": {
    "status": "healthy",
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "PostgreSQL 14.0",
    "poolSize": 5,
    "idleCount": 2,
    "waitingCount": 0
  },
  "memory": {
    "rss": 52428800,
    "heapTotal": 20971520,
    "heapUsed": 10485760
  },
  "environment": "development"
}
```

## 🚨 **Error Handling**

The system provides detailed error codes for better debugging:

```javascript
// Authentication errors
{
  "error": "Access token required",
  "code": "MISSING_TOKEN"
}

{
  "error": "Token expired",
  "code": "TOKEN_EXPIRED"
}

{
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS"
}

// Rate limiting errors
{
  "error": "Too many requests, please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 900
}

// Validation errors
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

## 🔧 **Configuration**

### **Security Configuration**

All security settings are centralized in `config/security.js`:

```javascript
const { config, validate, get } = require('./config/security');

// Get specific configuration
const jwtSecret = get('jwt.secret');
const rateLimit = get('rateLimiting.maxRequests');

// Validate configuration
const errors = validate();
if (errors.length > 0) {
  console.error('Configuration errors:', errors);
  process.exit(1);
}
```

### **Feature Flags**

Control security features with environment variables:

```env
ENABLE_TWO_FACTOR_AUTH=true
ENABLE_SMS_VERIFICATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_AUDIT_LOGGING=true
ENABLE_RATE_LIMITING=true
ENABLE_API_KEY_AUTH=true
```

## 📊 **Performance Considerations**

### **1. Database Optimization**

- Connection pooling with configurable limits
- Prepared statements for better performance
- Indexes on frequently queried columns
- Automatic cleanup of old audit logs

### **2. Caching Strategy**

- Token blacklist in memory (Redis recommended for production)
- Rate limit counters with automatic expiration
- Database query result caching

### **3. Monitoring**

- Request/response logging with performance metrics
- Database query performance tracking
- Memory usage monitoring
- Error rate tracking

## 🔒 **Production Checklist**

Before deploying to production:

- [ ] Change all default secrets and keys
- [ ] Set up proper SSL/TLS certificates
- [ ] Configure production database with strong passwords
- [ ] Set up monitoring and alerting
- [ ] Configure backup and recovery procedures
- [ ] Set up log aggregation and analysis
- [ ] Test rate limiting and security features
- [ ] Configure proper CORS origins
- [ ] Set up API key management
- [ ] Enable audit logging
- [ ] Configure security headers
- [ ] Set up intrusion detection
- [ ] Test authentication flows
- [ ] Verify database security
- [ ] Set up automated security scanning

## 🆘 **Troubleshooting**

### **Common Issues**

1. **JWT Token Expired**
   - Use refresh token to get new access token
   - Check token expiration settings

2. **Rate Limit Exceeded**
   - Wait for rate limit window to reset
   - Check rate limit configuration

3. **CORS Errors**
   - Verify CORS origins configuration
   - Check frontend URL settings

4. **Database Connection Issues**
   - Check database credentials
   - Verify connection pool settings

### **Debug Mode**

Enable debug mode for troubleshooting:

```env
DEBUG_MODE=true
SHOW_SQL_QUERIES=true
LOG_LEVEL=debug
```

## 📚 **Additional Resources**

- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
- [OWASP Security Guidelines](https://owasp.org/www-project-top-ten/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practices-security.html)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

## 🤝 **Contributing**

When contributing to security features:

1. Follow security best practices
2. Add comprehensive tests
3. Update documentation
4. Review for potential vulnerabilities
5. Test in staging environment first

---

**⚠️ Security Notice**: This implementation provides a solid security foundation, but security is an ongoing process. Regularly update dependencies, monitor for vulnerabilities, and stay informed about the latest security threats and best practices. 