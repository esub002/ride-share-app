/**
 * Performance Monitoring and Optimization System
 * Provides query optimization, response time tracking, and performance metrics
 */

const logger = require('./logger');
const { cacheManager } = require('./cache');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: new Map(),
      queries: new Map(),
      cache: {
        hits: 0,
        misses: 0,
        sets: 0
      },
      responseTimes: [],
      slowQueries: [],
      errors: new Map()
    };
    
    this.config = {
      slowQueryThreshold: 1000, // 1 second
      maxResponseTimeHistory: 1000,
      maxSlowQueries: 100,
      enableQueryLogging: process.env.NODE_ENV === 'development'
    };
  }

  /**
   * Request Performance Tracking
   */
  startRequest(req) {
    const requestId = req.id || this.generateId();
    req.id = requestId;
    
    this.metrics.requests.set(requestId, {
      startTime: Date.now(),
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    return requestId;
  }

  endRequest(req, res) {
    const requestId = req.id;
    if (!requestId || !this.metrics.requests.has(requestId)) {
      return;
    }

    const requestData = this.metrics.requests.get(requestId);
    const duration = Date.now() - requestData.startTime;
    
    // Update request data
    requestData.duration = duration;
    requestData.statusCode = res.statusCode;
    requestData.completed = true;
    
    // Track response time
    this.trackResponseTime(duration, requestData);
    
    // Log slow requests
    if (duration > this.config.slowQueryThreshold) {
      this.logSlowRequest(requestData);
    }
    
    // Clean up old request data
    setTimeout(() => {
      this.metrics.requests.delete(requestId);
    }, 60000); // Keep for 1 minute
  }

  /**
   * Query Performance Tracking
   */
  startQuery(query, params) {
    const queryId = this.generateId();
    const queryData = {
      query,
      params,
      startTime: Date.now(),
      cached: false
    };
    
    this.metrics.queries.set(queryId, queryData);
    return queryId;
  }

  endQuery(queryId, result, error = null) {
    if (!this.metrics.queries.has(queryId)) {
      return;
    }

    const queryData = this.metrics.queries.get(queryId);
    const duration = Date.now() - queryData.startTime;
    
    // Update query data
    queryData.duration = duration;
    queryData.result = result;
    queryData.error = error;
    queryData.completed = true;
    
    // Track slow queries
    if (duration > this.config.slowQueryThreshold) {
      this.trackSlowQuery(queryData);
    }
    
    // Log queries in development
    if (this.config.enableQueryLogging) {
      this.logQuery(queryData);
    }
    
    // Clean up old query data
    setTimeout(() => {
      this.metrics.queries.delete(queryId);
    }, 300000); // Keep for 5 minutes
  }

  /**
   * Cache Performance Tracking
   */
  trackCacheHit() {
    this.metrics.cache.hits++;
  }

  trackCacheMiss() {
    this.metrics.cache.misses++;
  }

  trackCacheSet() {
    this.metrics.cache.sets++;
  }

  /**
   * Response Time Tracking
   */
  trackResponseTime(duration, requestData) {
    this.metrics.responseTimes.push({
      duration,
      timestamp: Date.now(),
      method: requestData.method,
      url: requestData.url,
      statusCode: requestData.statusCode
    });
    
    // Keep only recent response times
    if (this.metrics.responseTimes.length > this.config.maxResponseTimeHistory) {
      this.metrics.responseTimes.shift();
    }
  }

  /**
   * Slow Query Tracking
   */
  trackSlowQuery(queryData) {
    this.metrics.slowQueries.push({
      query: queryData.query,
      params: queryData.params,
      duration: queryData.duration,
      timestamp: Date.now(),
      cached: queryData.cached
    });
    
    // Keep only recent slow queries
    if (this.metrics.slowQueries.length > this.config.maxSlowQueries) {
      this.metrics.slowQueries.shift();
    }
  }

  /**
   * Error Tracking
   */
  trackError(error, context) {
    const errorKey = `${error.code || error.name || 'Unknown'}`;
    
    if (!this.metrics.errors.has(errorKey)) {
      this.metrics.errors.set(errorKey, {
        count: 0,
        lastOccurrence: null,
        examples: []
      });
    }
    
    const errorData = this.metrics.errors.get(errorKey);
    errorData.count++;
    errorData.lastOccurrence = Date.now();
    
    // Keep example errors
    if (errorData.examples.length < 5) {
      errorData.examples.push({
        message: error.message,
        stack: error.stack,
        context,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Performance Metrics
   */
  getMetrics() {
    const responseTimes = this.metrics.responseTimes;
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt.duration, 0) / responseTimes.length 
      : 0;
    
    const slowQueries = this.metrics.slowQueries.length;
    const totalErrors = Array.from(this.metrics.errors.values())
      .reduce((sum, error) => sum + error.count, 0);
    
    const cacheHitRate = this.metrics.cache.hits + this.metrics.cache.misses > 0
      ? (this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses)) * 100
      : 0;
    
    return {
      requests: {
        total: this.metrics.requests.size,
        active: Array.from(this.metrics.requests.values()).filter(r => !r.completed).length
      },
      responseTime: {
        average: Math.round(avgResponseTime),
        recent: responseTimes.slice(-10).map(rt => rt.duration),
        distribution: this.getResponseTimeDistribution()
      },
      queries: {
        total: this.metrics.queries.size,
        slow: slowQueries
      },
      cache: {
        hits: this.metrics.cache.hits,
        misses: this.metrics.cache.misses,
        sets: this.metrics.cache.sets,
        hitRate: Math.round(cacheHitRate * 100) / 100
      },
      errors: {
        total: totalErrors,
        byType: Object.fromEntries(
          Array.from(this.metrics.errors.entries()).map(([key, value]) => [
            key, 
            { count: value.count, lastOccurrence: value.lastOccurrence }
          ])
        )
      },
      timestamp: Date.now()
    };
  }

  /**
   * Response Time Distribution
   */
  getResponseTimeDistribution() {
    const responseTimes = this.metrics.responseTimes.map(rt => rt.duration);
    const distribution = {
      '0-100ms': 0,
      '100-500ms': 0,
      '500ms-1s': 0,
      '1-5s': 0,
      '5s+': 0
    };
    
    responseTimes.forEach(duration => {
      if (duration < 100) distribution['0-100ms']++;
      else if (duration < 500) distribution['100-500ms']++;
      else if (duration < 1000) distribution['500ms-1s']++;
      else if (duration < 5000) distribution['1-5s']++;
      else distribution['5s+']++;
    });
    
    return distribution;
  }

  /**
   * Query Optimization
   */
  async optimizeQuery(query, params, pool) {
    // Check cache first
    if (cacheManager.isConnected) {
      const cached = await cacheManager.getQueryResult(query, params);
      if (cached) {
        this.trackCacheHit();
        return cached;
      }
      this.trackCacheMiss();
    }
    
    // Execute query with performance tracking
    const queryId = this.startQuery(query, params);
    
    try {
      const result = await pool.query(query, params);
      
      // Cache the result
      if (cacheManager.isConnected) {
        await cacheManager.cacheQueryResult(query, params, result.rows);
        this.trackCacheSet();
      }
      
      this.endQuery(queryId, result.rows);
      return result.rows;
    } catch (error) {
      this.endQuery(queryId, null, error);
      this.trackError(error, { query, params });
      throw error;
    }
  }

  /**
   * Query Analysis
   */
  analyzeQueries() {
    const queries = Array.from(this.metrics.queries.values());
    const analysis = {
      totalQueries: queries.length,
      slowQueries: queries.filter(q => q.duration > this.config.slowQueryThreshold),
      averageDuration: queries.length > 0 
        ? queries.reduce((sum, q) => sum + q.duration, 0) / queries.length 
        : 0,
      mostFrequent: this.getMostFrequentQueries(),
      cacheEfficiency: this.getCacheEfficiency()
    };
    
    return analysis;
  }

  getMostFrequentQueries() {
    const queryCounts = new Map();
    
    this.metrics.queries.forEach(queryData => {
      const queryKey = queryData.query.split(' ').slice(0, 3).join(' '); // First 3 words
      queryCounts.set(queryKey, (queryCounts.get(queryKey) || 0) + 1);
    });
    
    return Array.from(queryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([query, count]) => ({ query, count }));
  }

  getCacheEfficiency() {
    const total = this.metrics.cache.hits + this.metrics.cache.misses;
    return total > 0 ? {
      hitRate: (this.metrics.cache.hits / total) * 100,
      totalRequests: total,
      hits: this.metrics.cache.hits,
      misses: this.metrics.cache.misses
    } : { hitRate: 0, totalRequests: 0, hits: 0, misses: 0 };
  }

  /**
   * Performance Recommendations
   */
  getRecommendations() {
    const recommendations = [];
    const metrics = this.getMetrics();
    
    // Response time recommendations
    if (metrics.responseTime.average > 500) {
      recommendations.push({
        type: 'response_time',
        priority: 'high',
        message: 'Average response time is high. Consider implementing caching or query optimization.',
        metric: `${metrics.responseTime.average}ms average response time`
      });
    }
    
    // Cache recommendations
    if (metrics.cache.hitRate < 50) {
      recommendations.push({
        type: 'caching',
        priority: 'medium',
        message: 'Cache hit rate is low. Review cache strategies and TTL settings.',
        metric: `${metrics.cache.hitRate}% cache hit rate`
      });
    }
    
    // Slow query recommendations
    if (metrics.queries.slow > 10) {
      recommendations.push({
        type: 'query_optimization',
        priority: 'high',
        message: 'Multiple slow queries detected. Review and optimize database queries.',
        metric: `${metrics.queries.slow} slow queries`
      });
    }
    
    // Error recommendations
    if (metrics.errors.total > 100) {
      recommendations.push({
        type: 'error_handling',
        priority: 'medium',
        message: 'High error rate detected. Review error handling and logging.',
        metric: `${metrics.errors.total} total errors`
      });
    }
    
    return recommendations;
  }

  /**
   * Logging
   */
  logSlowRequest(requestData) {
    logger.warn('Slow Request Detected', {
      method: requestData.method,
      url: requestData.url,
      duration: requestData.duration,
      userId: requestData.userId,
      userRole: requestData.userRole,
      ip: requestData.ip
    });
  }

  logQuery(queryData) {
    logger.debug('Database Query', {
      query: queryData.query,
      params: queryData.params,
      duration: queryData.duration,
      cached: queryData.cached,
      error: queryData.error?.message
    });
  }

  /**
   * Utility Methods
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Reset Metrics
   */
  resetMetrics() {
    this.metrics = {
      requests: new Map(),
      queries: new Map(),
      cache: {
        hits: 0,
        misses: 0,
        sets: 0
      },
      responseTimes: [],
      slowQueries: [],
      errors: new Map()
    };
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Middleware for request performance tracking
const performanceMiddleware = () => {
  return (req, res, next) => {
    const requestId = performanceMonitor.startRequest(req);
    
    // Track response completion
    res.on('finish', () => {
      performanceMonitor.endRequest(req, res);
    });
    
    next();
  };
};

// Query optimization wrapper
const withPerformanceTracking = (query, params, ttl = 1800) => {
  return async (pool) => {
    return performanceMonitor.optimizeQuery(query, params, pool);
  };
};

module.exports = {
  performanceMonitor,
  performanceMiddleware,
  withPerformanceTracking
}; 