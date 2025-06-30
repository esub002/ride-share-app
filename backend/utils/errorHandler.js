/**
 * Enhanced Error Handling System
 * Provides custom error classes, centralized error handling, and detailed logging
 */

const logger = require('./logger');

// Custom Error Classes
class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT_ERROR', details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

class DatabaseError extends AppError {
  constructor(message, details = null) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message, details = null) {
    super(`External service error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', {
      service,
      details
    });
  }
}

// Error Response Formatter
const formatErrorResponse = (error, req) => {
  const response = {
    error: {
      message: error.message,
      code: error.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // Add details if available
  if (error.details) {
    response.error.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && error.stack) {
    response.error.stack = error.stack;
  }

  // Add request ID if available
  if (req.id) {
    response.error.requestId = req.id;
  }

  return response;
};

// Error Logging
const logError = (error, req) => {
  const logData = {
    error: {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: error.stack
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      userRole: req.user?.role
    },
    timestamp: new Date().toISOString()
  };

  if (error.statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', logData);
  } else {
    logger.info('Application Error', logData);
  }
};

// Global Error Handler Middleware
const globalErrorHandler = (error, req, res, next) => {
  // Set default values
  error.statusCode = error.statusCode || 500;
  error.message = error.message || 'Internal Server Error';

  // Log the error
  logError(error, req);

  // Handle specific error types
  if (error.name === 'ValidationError') {
    error = new ValidationError('Validation failed', error.details);
  } else if (error.name === 'CastError') {
    error = new ValidationError('Invalid ID format');
  } else if (error.code === '23505') { // PostgreSQL unique constraint
    error = new ConflictError('Resource already exists');
  } else if (error.code === '23503') { // PostgreSQL foreign key constraint
    error = new ValidationError('Referenced resource does not exist');
  } else if (error.code === '23514') { // PostgreSQL check constraint
    error = new ValidationError('Data validation failed');
  }

  // Format error response
  const errorResponse = formatErrorResponse(error, req);

  // Send response
  res.status(error.statusCode).json(errorResponse);
};

// Async Error Wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error Boundary for Express
const errorBoundary = (req, res, next) => {
  try {
    next();
  } catch (error) {
    globalErrorHandler(error, req, res, next);
  }
};

// Socket.IO Error Handler
const socketErrorHandler = (error, socket) => {
  const logData = {
    error: {
      message: error.message,
      stack: error.stack
    },
    socket: {
      id: socket.id,
      userId: socket.userId,
      userRole: socket.userRole
    },
    timestamp: new Date().toISOString()
  };

  logger.error('Socket.IO Error', logData);

  // Send error to client
  socket.emit('error', {
    message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    code: 'SOCKET_ERROR'
  });
};

// Database Error Handler
const handleDatabaseError = (error, operation) => {
  const logData = {
    error: {
      message: error.message,
      code: error.code,
      detail: error.detail
    },
    operation,
    timestamp: new Date().toISOString()
  };

  logger.error('Database Error', logData);

  // Map database errors to application errors
  if (error.code === '23505') {
    throw new ConflictError('Resource already exists');
  } else if (error.code === '23503') {
    throw new ValidationError('Referenced resource does not exist');
  } else if (error.code === '23514') {
    throw new ValidationError('Data validation failed');
  } else if (error.code === '42P01') {
    throw new DatabaseError('Table does not exist');
  } else if (error.code === '42703') {
    throw new DatabaseError('Column does not exist');
  } else {
    throw new DatabaseError('Database operation failed');
  }
};

// Validation Error Handler
const handleValidationError = (errors, req) => {
  const details = errors.array().map(err => ({
    field: err.param,
    message: err.msg,
    value: err.value
  }));

  logError(new ValidationError('Validation failed', details), req);
  
  return new ValidationError('Validation failed', details);
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  globalErrorHandler,
  asyncHandler,
  errorBoundary,
  socketErrorHandler,
  handleDatabaseError,
  handleValidationError,
  formatErrorResponse,
  logError
}; 