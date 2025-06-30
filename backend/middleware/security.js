const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const { logEvent } = require('../utils/log');

// API Key management (in production, store in database)
const validApiKeys = new Set([
  process.env.API_KEY_1,
  process.env.API_KEY_2,
  process.env.API_KEY_3
].filter(Boolean));

/**
 * Enhanced CORS configuration
 */
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGINS ? 
      process.env.CORS_ORIGINS.split(',') : 
      [
        'http://localhost:3000',
        'http://localhost:19006', 
        'exp://localhost:19000',
        'http://localhost:3001',
        'http://localhost:3002'
      ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logEvent('cors_violation', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-API-Key',
    'X-Client-Version'
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // 24 hours
};

/**
 * Enhanced Helmet configuration
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "ws:", "wss:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
};

/**
 * Rate limiting configurations
 */
const rateLimiters = {
  // Global rate limiter
  global: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      error: 'Too many requests, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logEvent('rate_limit_exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      res.status(429).json({
        error: 'Too many requests, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(15 * 60 / 1000) // 15 minutes in seconds
      });
    }
  }),

  // Authentication rate limiter (more strict)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 auth requests per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logEvent('auth_rate_limit_exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        endpoint: req.originalUrl
      });
      res.status(429).json({
        error: 'Too many authentication attempts, please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(15 * 60 / 1000)
      });
    }
  }),

  // API key rate limiter
  apiKey: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // limit each API key to 1000 requests per minute
    keyGenerator: (req) => req.headers['x-api-key'] || req.ip,
    message: {
      error: 'API rate limit exceeded.',
      code: 'API_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  }),

  // File upload rate limiter
  upload: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 uploads per minute
    message: {
      error: 'Too many file uploads, please try again later.',
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false
  })
};

/**
 * API Key validation middleware
 */
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      error: 'API key required',
      code: 'MISSING_API_KEY'
    });
  }
  
  if (!validApiKeys.has(apiKey)) {
    logEvent('invalid_api_key', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl
    });
    
    return res.status(401).json({
      error: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
};

/**
 * Request validation middleware
 */
const validateRequest = (validations) => {
  return async (req, res, next) => {
    // Apply validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      logEvent('validation_error', {
        ip: req.ip,
        endpoint: req.originalUrl,
        errors: errors.array()
      });
      
      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors.array()
      });
    }
    
    next();
  };
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        // Remove potential XSS vectors
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      }
    });
  }
  
  next();
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log request
  logEvent('api_request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userRole: req.user?.role,
    apiKey: req.headers['x-api-key'] ? 'present' : 'none'
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logEvent('api_response', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role
    });
    
    // Log errors
    if (res.statusCode >= 400) {
      logEvent('api_error', {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userId: req.user?.id,
        userRole: req.user?.role,
        error: res.locals.error || 'Unknown error'
      });
    }
  });
  
  next();
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  logEvent('unhandled_error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
    userRole: req.user?.role
  });
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isDevelopment && { stack: err.stack })
  });
};

/**
 * Security headers middleware
 */
const securityHeaders = (req, res, next) => {
  // Additional security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Request size limiting middleware
 */
const limitRequestSize = (req, res, next) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      error: 'Request entity too large',
      code: 'REQUEST_TOO_LARGE'
    });
  }
  
  next();
};

/**
 * Common validation rules
 */
const commonValidations = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  
  password: body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character'),
  
  phone: body('phone')
    .isMobilePhone()
    .withMessage('Invalid phone number format'),
  
  name: body('name')
    .isLength({ min: 2, max: 100 })
    .trim()
    .escape()
    .withMessage('Name must be between 2 and 100 characters'),
  
  id: body('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID format'),
  
  coordinates: body(['latitude', 'longitude'])
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid coordinates')
};

module.exports = {
  corsOptions,
  helmetConfig,
  rateLimiters,
  validateApiKey,
  validateRequest,
  sanitizeInput,
  requestLogger,
  errorHandler,
  securityHeaders,
  limitRequestSize,
  commonValidations
};
