# Caching & Performance System

This document describes the comprehensive caching and performance monitoring system implemented in the ride-share backend.

## 🚀 Overview

The caching system provides:
- **Redis-based caching** for API responses, query results, and sessions
- **Real-time data caching** for user locations, driver status, and ride information
- **Performance monitoring** with metrics, analytics, and optimization recommendations
- **Query optimization** with automatic caching and performance tracking

## 📦 Dependencies

```bash
npm install ioredis uuid compression express-slow-down
```

## 🔧 Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_PREFIX=rideshare:

# Performance Settings
SLOW_QUERY_THRESHOLD=1000
ENABLE_QUERY_LOGGING=true
MAX_RESPONSE_TIME_HISTORY=1000
```

### Docker Setup

```yaml
# docker-compose.yml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes
```

## 🏗️ Architecture

### Cache Manager (`utils/cache.js`)

The main caching system with the following features:

#### API Response Caching
```javascript
// Cache API response
await cacheManager.cacheApiResponse('users:list', userData, 1800);

// Retrieve cached response
const cached = await cacheManager.getApiResponse('users:list');
```

#### Query Result Caching
```javascript
// Cache database query results
await cacheManager.cacheQueryResult(query, params, result, 1800);

// Retrieve cached query results
const cached = await cacheManager.getQueryResult(query, params);
```

#### Session Storage
```javascript
// Store user session
await cacheManager.setSession(sessionId, sessionData, 86400);

// Retrieve session
const session = await cacheManager.getSession(sessionId);

// Delete session
await cacheManager.deleteSession(sessionId);
```

#### Real-time Data Caching
```javascript
// Cache user data
await cacheManager.cacheUserData(userId, userData, 1800);

// Cache driver data
await cacheManager.cacheDriverData(driverId, driverData, 300);

// Cache ride data
await cacheManager.cacheRideData(rideId, rideData, 600);

// Cache location data
await cacheManager.cacheLocationData(userId, location, 60);
```

### Performance Monitor (`utils/performance.js`)

Comprehensive performance tracking system:

#### Request Performance Tracking
```javascript
// Automatically tracks all requests
const requestId = performanceMonitor.startRequest(req);
performanceMonitor.endRequest(req, res);
```

#### Query Performance Tracking
```javascript
// Track database queries
const queryId = performanceMonitor.startQuery(query, params);
performanceMonitor.endQuery(queryId, result, error);
```

#### Performance Metrics
```javascript
// Get comprehensive metrics
const metrics = performanceMonitor.getMetrics();

// Get query analysis
const analysis = performanceMonitor.analyzeQueries();

// Get optimization recommendations
const recommendations = performanceMonitor.getRecommendations();
```

## 🔌 Middleware Integration

### Cache Middleware
```javascript
// Apply caching to routes
app.use('/api/users', cacheMiddleware(1800, (req) => {
  return `users:${req.user.id}:${req.query.page}`;
}));
```

### Performance Middleware
```javascript
// Apply performance tracking
app.use(performanceMiddleware());
```

### Query Optimization Wrapper
```javascript
// Optimize database queries with caching
const optimizedQuery = withQueryCache(query, params, 1800);
const result = await optimizedQuery(pool);
```

## 📊 Performance API Endpoints

### Get Performance Metrics
```http
GET /api/performance/metrics
Authorization: Bearer <token>
X-API-Key: <api-key>
```

Response:
```json
{
  "success": true,
  "data": {
    "requests": {
      "total": 1500,
      "active": 5
    },
    "responseTime": {
      "average": 245,
      "recent": [120, 180, 300, 200, 150],
      "distribution": {
        "0-100ms": 45,
        "100-500ms": 35,
        "500ms-1s": 15,
        "1-5s": 4,
        "5s+": 1
      }
    },
    "queries": {
      "total": 800,
      "slow": 12
    },
    "cache": {
      "hits": 650,
      "misses": 150,
      "sets": 200,
      "hitRate": 81.25
    },
    "errors": {
      "total": 25,
      "byType": {
        "VALIDATION_ERROR": 15,
        "AUTHENTICATION_ERROR": 10
      }
    }
  }
}
```

### Get Cache Statistics
```http
GET /api/performance/cache
Authorization: Bearer <token>
X-API-Key: <api-key>
```

### Get Query Analysis
```http
GET /api/performance/queries
Authorization: Bearer <token>
X-API-Key: <api-key>
```

### Get Performance Recommendations
```http
GET /api/performance/recommendations
Authorization: Bearer <token>
X-API-Key: <api-key>
```

### Get System Health
```http
GET /api/performance/health
Authorization: Bearer <token>
X-API-Key: <api-key>
```

### Invalidate Cache
```http
POST /api/performance/cache/invalidate
Authorization: Bearer <token>
X-API-Key: <api-key>
Content-Type: application/json

{
  "pattern": "user:*"
}
```

### Get Performance Dashboard
```http
GET /api/performance/dashboard
Authorization: Bearer <token>
X-API-Key: <api-key>
```

## 🎯 Usage Examples

### Caching User Data
```javascript
// In user routes
router.get('/profile', auth('user'), async (req, res) => {
  const userId = req.user.id;
  
  // Try to get from cache first
  let userData = await cacheManager.getUserData(userId);
  
  if (!userData) {
    // Fetch from database
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    userData = result.rows[0];
    
    // Cache the result
    await cacheManager.cacheUserData(userId, userData, 1800);
  }
  
  res.json(userData);
});
```

### Caching Driver Locations
```javascript
// In driver routes
router.put('/location', auth('driver'), async (req, res) => {
  const driverId = req.user.id;
  const { latitude, longitude } = req.body;
  
  // Update database
  await pool.query(
    'UPDATE drivers SET latitude = $1, longitude = $2 WHERE id = $3',
    [latitude, longitude, driverId]
  );
  
  // Cache location data
  await cacheManager.cacheLocationData(driverId, { latitude, longitude }, 60);
  
  res.json({ success: true });
});
```

### Optimizing Database Queries
```javascript
// Before optimization
const result = await pool.query('SELECT * FROM rides WHERE driver_id = $1', [driverId]);

// After optimization with caching
const optimizedQuery = withQueryCache(
  'SELECT * FROM rides WHERE driver_id = $1',
  [driverId],
  1800
);
const result = await optimizedQuery(pool);
```

### Cache Invalidation
```javascript
// Invalidate user-related cache when user data changes
router.put('/profile', auth('user'), async (req, res) => {
  const userId = req.user.id;
  
  // Update database
  await pool.query('UPDATE users SET name = $1 WHERE id = $2', [name, userId]);
  
  // Invalidate related cache
  await cacheManager.invalidateUser(userId);
  
  res.json({ success: true });
});
```

## 📈 Performance Monitoring

### Key Metrics Tracked

1. **Request Performance**
   - Response times
   - Request counts
   - Active requests
   - Slow request detection

2. **Query Performance**
   - Query execution times
   - Slow query identification
   - Query frequency analysis
   - Cache efficiency

3. **Cache Performance**
   - Hit/miss ratios
   - Cache size and memory usage
   - Cache invalidation patterns
   - Redis connection health

4. **Error Tracking**
   - Error rates by type
   - Error frequency analysis
   - Error context and examples

### Performance Recommendations

The system automatically generates recommendations based on:

- **High Response Times**: Suggests caching or query optimization
- **Low Cache Hit Rates**: Recommends cache strategy review
- **Slow Queries**: Identifies queries needing optimization
- **High Error Rates**: Suggests error handling improvements

## 🔧 Configuration Options

### Cache TTL Settings
```javascript
const cacheConfig = {
  api: 3600,        // API responses: 1 hour
  query: 1800,      // Query results: 30 minutes
  session: 86400,   // Sessions: 24 hours
  user: 1800,       // User data: 30 minutes
  driver: 300,      // Driver data: 5 minutes
  ride: 600,        // Ride data: 10 minutes
  location: 60      // Location data: 1 minute
};
```

### Performance Thresholds
```javascript
const performanceConfig = {
  slowQueryThreshold: 1000,        // 1 second
  maxResponseTimeHistory: 1000,    // Keep last 1000 response times
  maxSlowQueries: 100,             // Keep last 100 slow queries
  enableQueryLogging: true         // Log queries in development
};
```

## 🚨 Error Handling

The caching system includes comprehensive error handling:

- **Redis Connection Failures**: Graceful fallback to database
- **Cache Misses**: Automatic database fallback
- **Performance Monitoring**: Continues working even if monitoring fails
- **Memory Management**: Automatic cleanup of old metrics

## 🔒 Security Considerations

- **Cache Keys**: Properly namespaced to prevent conflicts
- **Sensitive Data**: Never cache sensitive information
- **Access Control**: Performance endpoints require admin privileges
- **Rate Limiting**: Performance endpoints are rate-limited

## 📝 Best Practices

1. **Cache Strategically**: Only cache frequently accessed, rarely changed data
2. **Set Appropriate TTL**: Balance freshness with performance
3. **Invalidate Properly**: Clear cache when data changes
4. **Monitor Performance**: Regularly check performance metrics
5. **Use Cache Keys**: Generate unique, descriptive cache keys
6. **Handle Failures**: Always have fallback mechanisms

## 🔍 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis server status
   - Verify connection settings
   - Check network connectivity

2. **High Cache Miss Rate**
   - Review cache TTL settings
   - Check cache invalidation patterns
   - Analyze data access patterns

3. **Slow Response Times**
   - Check database query performance
   - Review cache hit rates
   - Analyze slow query logs

4. **Memory Issues**
   - Monitor Redis memory usage
   - Check cache key patterns
   - Review TTL settings

### Debug Commands

```bash
# Check Redis status
redis-cli ping

# Monitor Redis operations
redis-cli monitor

# Check Redis memory usage
redis-cli info memory

# List cache keys
redis-cli keys "rideshare:*"
```

## 📚 Additional Resources

- [Redis Documentation](https://redis.io/documentation)
- [ioredis Documentation](https://github.com/luin/ioredis)
- [Express Performance Best Practices](https://expressjs.com/en/advanced/best-practices-performance.html)
- [Node.js Performance Monitoring](https://nodejs.org/en/docs/guides/simple-profiling/) 