/**
 * Redis Caching System
 * Provides comprehensive caching for API responses, query results, sessions, and real-time data
 */

const Redis = require('ioredis');
const logger = require('./logger');

class CacheManager {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
    this.prefixes = {
      api: 'api:',
      query: 'query:',
      session: 'session:',
      realtime: 'realtime:',
      user: 'user:',
      driver: 'driver:',
      ride: 'ride:',
      location: 'location:'
    };
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000,
        keyPrefix: process.env.REDIS_PREFIX || 'rideshare:'
      });

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.isConnected = false;
      });

      this.redis.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.redis.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.redis.connect();
      return true;
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      return false;
    }
  }

  /**
   * Generate cache key with prefix
   */
  generateKey(prefix, ...parts) {
    const key = parts.join(':');
    return `${this.prefixes[prefix]}${key}`;
  }

  /**
   * API Response Caching
   */
  async cacheApiResponse(key, data, ttl = this.defaultTTL) {
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateKey('api', key);
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheData));
      logger.debug(`API response cached: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error('API response caching error:', error);
      return false;
    }
  }

  async getApiResponse(key) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateKey('api', key);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.debug(`API response retrieved from cache: ${cacheKey}`);
        return parsed.data;
      }
      
      return null;
    } catch (error) {
      logger.error('API response retrieval error:', error);
      return null;
    }
  }

  /**
   * Query Result Caching
   */
  async cacheQueryResult(query, params, result, ttl = 1800) { // 30 minutes
    if (!this.isConnected) return false;
    
    try {
      const queryHash = this.hashQuery(query, params);
      const cacheKey = this.generateKey('query', queryHash);
      const cacheData = {
        query,
        params,
        result,
        timestamp: Date.now(),
        ttl
      };
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheData));
      logger.debug(`Query result cached: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error('Query result caching error:', error);
      return false;
    }
  }

  async getQueryResult(query, params) {
    if (!this.isConnected) return null;
    
    try {
      const queryHash = this.hashQuery(query, params);
      const cacheKey = this.generateKey('query', queryHash);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.debug(`Query result retrieved from cache: ${cacheKey}`);
        return parsed.result;
      }
      
      return null;
    } catch (error) {
      logger.error('Query result retrieval error:', error);
      return null;
    }
  }

  /**
   * Session Storage
   */
  async setSession(sessionId, sessionData, ttl = 86400) { // 24 hours
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateKey('session', sessionId);
      const session = {
        ...sessionData,
        lastAccess: Date.now(),
        ttl
      };
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(session));
      logger.debug(`Session stored: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error('Session storage error:', error);
      return false;
    }
  }

  async getSession(sessionId) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateKey('session', sessionId);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const session = JSON.parse(cached);
        // Update last access
        session.lastAccess = Date.now();
        await this.redis.setex(cacheKey, session.ttl, JSON.stringify(session));
        logger.debug(`Session retrieved: ${sessionId}`);
        return session;
      }
      
      return null;
    } catch (error) {
      logger.error('Session retrieval error:', error);
      return null;
    }
  }

  async deleteSession(sessionId) {
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateKey('session', sessionId);
      await this.redis.del(cacheKey);
      logger.debug(`Session deleted: ${sessionId}`);
      return true;
    } catch (error) {
      logger.error('Session deletion error:', error);
      return false;
    }
  }

  /**
   * Real-time Data Caching
   */
  async cacheRealtimeData(type, id, data, ttl = 300) { // 5 minutes
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateKey('realtime', type, id);
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(cacheData));
      logger.debug(`Real-time data cached: ${cacheKey}`);
      return true;
    } catch (error) {
      logger.error('Real-time data caching error:', error);
      return false;
    }
  }

  async getRealtimeData(type, id) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateKey('realtime', type, id);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.debug(`Real-time data retrieved: ${cacheKey}`);
        return parsed.data;
      }
      
      return null;
    } catch (error) {
      logger.error('Real-time data retrieval error:', error);
      return null;
    }
  }

  /**
   * User Data Caching
   */
  async cacheUserData(userId, data, ttl = 1800) { // 30 minutes
    return this.cacheRealtimeData('user', userId, data, ttl);
  }

  async getUserData(userId) {
    return this.getRealtimeData('user', userId);
  }

  /**
   * Driver Data Caching
   */
  async cacheDriverData(driverId, data, ttl = 300) { // 5 minutes
    return this.cacheRealtimeData('driver', driverId, data, ttl);
  }

  async getDriverData(driverId) {
    return this.getRealtimeData('driver', driverId);
  }

  /**
   * Ride Data Caching
   */
  async cacheRideData(rideId, data, ttl = 600) { // 10 minutes
    return this.cacheRealtimeData('ride', rideId, data, ttl);
  }

  async getRideData(rideId) {
    return this.getRealtimeData('ride', rideId);
  }

  /**
   * Location Data Caching
   */
  async cacheLocationData(userId, location, ttl = 60) { // 1 minute
    if (!this.isConnected) return false;
    
    try {
      const cacheKey = this.generateKey('location', userId);
      const locationData = {
        ...location,
        timestamp: Date.now(),
        ttl
      };
      
      await this.redis.setex(cacheKey, ttl, JSON.stringify(locationData));
      logger.debug(`Location cached: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Location caching error:', error);
      return false;
    }
  }

  async getLocationData(userId) {
    if (!this.isConnected) return null;
    
    try {
      const cacheKey = this.generateKey('location', userId);
      const cached = await this.redis.get(cacheKey);
      
      if (cached) {
        const parsed = JSON.parse(cached);
        logger.debug(`Location retrieved: ${userId}`);
        return parsed;
      }
      
      return null;
    } catch (error) {
      logger.error('Location retrieval error:', error);
      return null;
    }
  }

  /**
   * Cache Invalidation
   */
  async invalidatePattern(pattern) {
    if (!this.isConnected) return false;
    
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.info(`Invalidated ${keys.length} cache keys matching pattern: ${pattern}`);
      }
      return true;
    } catch (error) {
      logger.error('Cache invalidation error:', error);
      return false;
    }
  }

  async invalidateUser(userId) {
    const patterns = [
      `${this.prefixes.user}${userId}:*`,
      `${this.prefixes.session}*`,
      `${this.prefixes.location}${userId}`
    ];
    
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }

  async invalidateDriver(driverId) {
    const patterns = [
      `${this.prefixes.driver}${driverId}:*`,
      `${this.prefixes.location}${driverId}`
    ];
    
    for (const pattern of patterns) {
      await this.invalidatePattern(pattern);
    }
  }

  async invalidateRide(rideId) {
    const pattern = `${this.prefixes.ride}${rideId}:*`;
    await this.invalidatePattern(pattern);
  }

  /**
   * Cache Statistics
   */
  async getStats() {
    if (!this.isConnected) return null;
    
    try {
      const info = await this.redis.info();
      const memory = await this.redis.memory('USAGE');
      const keys = await this.redis.dbsize();
      
      return {
        connected: this.isConnected,
        keys,
        memory: parseInt(memory) || 0,
        info: info.split('\r\n').reduce((acc, line) => {
          const [key, value] = line.split(':');
          if (key && value) acc[key] = value;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Cache stats error:', error);
      return null;
    }
  }

  /**
   * Utility Methods
   */
  hashQuery(query, params) {
    const queryString = query + JSON.stringify(params || []);
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Health Check
   */
  async healthCheck() {
    if (!this.isConnected) return false;
    
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  /**
   * Cleanup
   */
  async disconnect() {
    if (this.redis) {
      await this.redis.quit();
      this.isConnected = false;
      logger.info('Redis disconnected');
    }
  }
}

// Create singleton instance
const cacheManager = new CacheManager();

// Middleware for API response caching
const cacheMiddleware = (ttl = 1800, keyGenerator = null) => {
  return async (req, res, next) => {
    if (!cacheManager.isConnected) {
      return next();
    }

    const cacheKey = keyGenerator ? keyGenerator(req) : `${req.method}:${req.originalUrl}`;
    
    try {
      const cachedResponse = await cacheManager.getApiResponse(cacheKey);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }
    } catch (error) {
      logger.error('Cache middleware error:', error);
    }

    // Store original send method
    const originalSend = res.json;
    
    // Override send method to cache response
    res.json = function(data) {
      cacheManager.cacheApiResponse(cacheKey, data, ttl);
      return originalSend.call(this, data);
    };

    next();
  };
};

// Database query caching wrapper
const withQueryCache = (query, params, ttl = 1800) => {
  return async (pool) => {
    try {
      // Try to get from cache first
      const cached = await cacheManager.getQueryResult(query, params);
      if (cached) {
        return cached;
      }

      // Execute query
      const result = await pool.query(query, params);
      
      // Cache the result
      await cacheManager.cacheQueryResult(query, params, result.rows, ttl);
      
      return result.rows;
    } catch (error) {
      logger.error('Query cache wrapper error:', error);
      throw error;
    }
  };
};

module.exports = {
  cacheManager,
  cacheMiddleware,
  withQueryCache
}; 