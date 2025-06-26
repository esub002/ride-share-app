const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
      log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // General log file
    new winston.transports.File({
      filename: path.join(logsDir, 'app.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Error log file
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Safety events log file
    new winston.transports.File({
      filename: path.join(logsDir, 'safety.log'),
      level: 'info',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Production-specific configurations
if (process.env.NODE_ENV === 'production') {
  // Add Sentry transport if configured
  if (process.env.SENTRY_DSN) {
    const Sentry = require('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1
    });
    
    logger.add(new winston.transports.Stream({
      stream: {
        write: (message) => {
          Sentry.captureMessage(message);
        }
      }
    }));
  }
}

// Custom logging methods for safety events
logger.safety = (message, meta = {}) => {
  logger.info(`🚨 SAFETY: ${message}`, { ...meta, category: 'safety' });
};

logger.emergency = (message, meta = {}) => {
  logger.error(`🚨 EMERGENCY: ${message}`, { ...meta, category: 'emergency' });
};

logger.incident = (message, meta = {}) => {
  logger.warn(`⚠️ INCIDENT: ${message}`, { ...meta, category: 'incident' });
};

logger.ride = (message, meta = {}) => {
  logger.info(`🚗 RIDE: ${message}`, { ...meta, category: 'ride' });
};

logger.auth = (message, meta = {}) => {
  logger.info(`🔐 AUTH: ${message}`, { ...meta, category: 'auth' });
};

logger.api = (message, meta = {}) => {
  logger.info(`🌐 API: ${message}`, { ...meta, category: 'api' });
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role
    };
    
    if (res.statusCode >= 400) {
      logger.warn('API Request Error', logData);
    } else {
      logger.api('API Request', logData);
    }
  });
  
  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    userId: req.user?.id,
    userRole: req.user?.role,
    ip: req.ip
  });
  
  next(err);
};

// Performance monitoring
const performanceLogger = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    if (duration > 1000) { // Log slow requests (>1s)
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?.id
      });
    }
  });
  
  next();
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
  performanceLogger
}; 