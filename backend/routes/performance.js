/**
 * Performance Monitoring API Routes
 * Provides endpoints for performance metrics, cache statistics, and optimization
 */

const express = require('express');
const { auth } = require('../middleware/auth');
const { cacheManager } = require('../utils/cache');
const { performanceMonitor } = require('../utils/performance');
const { asyncHandler } = require('../utils/errorHandler');
const router = express.Router();

/**
 * @swagger
 * /api/performance/metrics:
 *   get:
 *     summary: Get performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance metrics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get performance metrics
router.get('/metrics', auth('admin'), asyncHandler(async (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  
  res.json({
    success: true,
    data: metrics,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/cache:
 *   get:
 *     summary: Get cache statistics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get cache statistics
router.get('/cache', auth('admin'), asyncHandler(async (req, res) => {
  const cacheStats = await cacheManager.getStats();
  const performanceMetrics = performanceMonitor.getMetrics();
  
  res.json({
    success: true,
    data: {
      redis: cacheStats,
      performance: performanceMetrics.cache,
      recommendations: performanceMonitor.getRecommendations()
        .filter(rec => rec.type === 'caching')
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/queries:
 *   get:
 *     summary: Get query analysis
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Query analysis
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get query analysis
router.get('/queries', auth('admin'), asyncHandler(async (req, res) => {
  const analysis = performanceMonitor.analyzeQueries();
  
  res.json({
    success: true,
    data: analysis,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/slow-queries:
 *   get:
 *     summary: Get slow queries
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Slow queries list
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get slow queries
router.get('/slow-queries', auth('admin'), asyncHandler(async (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  
  res.json({
    success: true,
    data: {
      slowQueries: metrics.queries.slow,
      totalQueries: metrics.queries.total,
      slowQueryPercentage: metrics.queries.total > 0 
        ? (metrics.queries.slow / metrics.queries.total) * 100 
        : 0
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/errors:
 *   get:
 *     summary: Get error statistics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Error statistics
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get error statistics
router.get('/errors', auth('admin'), asyncHandler(async (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  
  res.json({
    success: true,
    data: {
      totalErrors: metrics.errors.total,
      errorTypes: metrics.errors.byType,
      errorRate: metrics.requests.total > 0 
        ? (metrics.errors.total / metrics.requests.total) * 100 
        : 0
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/recommendations:
 *   get:
 *     summary: Get performance recommendations
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Performance recommendations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get performance recommendations
router.get('/recommendations', auth('admin'), asyncHandler(async (req, res) => {
  const recommendations = performanceMonitor.getRecommendations();
  
  res.json({
    success: true,
    data: {
      recommendations,
      total: recommendations.length,
      byPriority: {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      }
    },
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/health:
 *   get:
 *     summary: Get system health status
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System health status
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get system health status
router.get('/health', auth('admin'), asyncHandler(async (req, res) => {
  const cacheHealth = await cacheManager.healthCheck();
  const metrics = performanceMonitor.getMetrics();
  
  const health = {
    cache: {
      status: cacheHealth ? 'healthy' : 'unhealthy',
      connected: cacheManager.isConnected
    },
    performance: {
      status: metrics.responseTime.average < 500 ? 'healthy' : 'warning',
      averageResponseTime: metrics.responseTime.average,
      errorRate: metrics.errors.total > 100 ? 'high' : 'normal'
    },
    overall: 'healthy'
  };
  
  // Determine overall health
  if (!cacheHealth || metrics.responseTime.average > 1000 || metrics.errors.total > 200) {
    health.overall = 'unhealthy';
  } else if (!cacheHealth || metrics.responseTime.average > 500 || metrics.errors.total > 100) {
    health.overall = 'warning';
  }
  
  res.json({
    success: true,
    data: health,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/cache/invalidate:
 *   post:
 *     summary: Invalidate cache
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 description: Cache key pattern to invalidate
 *     responses:
 *       200:
 *         description: Cache invalidated
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Invalidate cache
router.post('/cache/invalidate', auth('admin'), asyncHandler(async (req, res) => {
  const { pattern } = req.body;
  
  if (!pattern) {
    return res.status(400).json({
      success: false,
      error: 'Pattern is required'
    });
  }
  
  const result = await cacheManager.invalidatePattern(pattern);
  
  res.json({
    success: result,
    message: result ? 'Cache invalidated successfully' : 'Failed to invalidate cache',
    pattern,
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/reset:
 *   post:
 *     summary: Reset performance metrics
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics reset
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Reset performance metrics
router.post('/reset', auth('admin'), asyncHandler(async (req, res) => {
  performanceMonitor.resetMetrics();
  
  res.json({
    success: true,
    message: 'Performance metrics reset successfully',
    timestamp: new Date().toISOString()
  });
}));

/**
 * @swagger
 * /api/performance/dashboard:
 *   get:
 *     summary: Get performance dashboard data
 *     tags: [Performance]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */

// Get performance dashboard data
router.get('/dashboard', auth('admin'), asyncHandler(async (req, res) => {
  const metrics = performanceMonitor.getMetrics();
  const cacheStats = await cacheManager.getStats();
  const recommendations = performanceMonitor.getRecommendations();
  const analysis = performanceMonitor.analyzeQueries();
  
  const dashboard = {
    overview: {
      totalRequests: metrics.requests.total,
      activeRequests: metrics.requests.active,
      averageResponseTime: metrics.responseTime.average,
      cacheHitRate: metrics.cache.hitRate,
      errorRate: metrics.errors.total
    },
    performance: {
      responseTimeDistribution: metrics.responseTime.distribution,
      recentResponseTimes: metrics.responseTime.recent,
      slowQueries: metrics.queries.slow
    },
    cache: {
      stats: cacheStats,
      efficiency: metrics.cache
    },
    queries: {
      analysis: analysis,
      mostFrequent: analysis.mostFrequent
    },
    recommendations: {
      list: recommendations,
      count: recommendations.length,
      priorityBreakdown: {
        high: recommendations.filter(r => r.priority === 'high').length,
        medium: recommendations.filter(r => r.priority === 'medium').length,
        low: recommendations.filter(r => r.priority === 'low').length
      }
    },
    health: {
      cache: cacheManager.isConnected,
      performance: metrics.responseTime.average < 500,
      errors: metrics.errors.total < 100
    }
  };
  
  res.json({
    success: true,
    data: dashboard,
    timestamp: new Date().toISOString()
  });
}));

module.exports = router; 