// Global error handlers for debugging
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Load environment variables
require('dotenv').config();

// --- BEGIN: Safe require block ---
try {
  console.log('✅ [DEBUG] Starting server.js requires...');
  // server.js - Main Express app and Socket.IO server
  // Sets up routes, middleware, and real-time events

  // Basic Express + Socket.IO backend for ride assignment
  const express = require('express');
  const http = require('http');
  const { Server } = require('socket.io');

  // Import enhanced middleware
  const { auth, optionalAuth, refreshToken, logout } = require('./middleware/auth');
  const { 
    corsOptions, 
    helmetConfig, 
    rateLimiters, 
    validateApiKey,
    sanitizeInput,
    requestLogger,
    securityHeaders,
    limitRequestSize
  } = require('./middleware/security');
  const { 
    pool, 
    secureQuery, 
    transaction, 
    auditLog,
    healthCheck 
  } = require('./middleware/database');

  // Import caching and performance systems
  const { cacheManager } = require('./utils/cache');
  const { performanceMonitor, performanceMiddleware } = require('./utils/performance');
  const { globalErrorHandler } = require('./utils/errorHandler');

  // Import routes
  const userRoutes = require('./routes/user');
  const driverRoutes = require('./routes/driver');
  const rideRoutes = require('./routes/ride');
  const authUser = require('./routes/authUser');
  const authDriver = require('./routes/authDriver');
  const adminRoutes = require('./routes/admin');
  const analyticsRoutes = require('./routes/analytics');
  const safetyRoutes = require('./routes/safety');
  const performanceRoutes = require('./routes/performance');

  // Import utilities
  const morgan = require('morgan');
  const cors = require('cors');
  const helmet = require('helmet');
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');

  const SocketService = require('./services/socketService');

  const app = express();
  const server = http.createServer(app);

  // Set database pool in app.locals for tests
  app.locals.pool = pool;

  // Initialize caching and performance systems
  let cacheInitialized = false;
  let performanceInitialized = false;

  // Initialize Redis cache
  async function initializeCache() {
    try {
      cacheInitialized = await cacheManager.connect();
      if (cacheInitialized) {
        console.log('✅ Redis cache initialized successfully');
      } else {
        console.warn('⚠️ Redis cache initialization failed - continuing without cache');
      }
    } catch (error) {
      console.error('❌ Redis cache initialization error:', error);
    }
  }

  // Initialize performance monitoring
  function initializePerformance() {
    try {
      performanceInitialized = true;
      console.log('✅ Performance monitoring initialized');
    } catch (error) {
      console.error('❌ Performance monitoring initialization error:', error);
    }
  }

  // Initialize systems
  initializeCache();
  initializePerformance();

  // Initialize Socket.IO with advanced SocketService
  let socketService;
  try {
    socketService = new SocketService(server);
    app.set('io', socketService.getIO());
  } catch (error) {
    console.error('Socket.IO initialization error:', error);
    socketService = null;
  }

  // In-memory stores for development when database is not available
  let availableDrivers = {};
  let pendingRides = {};
  let rideIdCounter = 1;

  // Mock data for development
  const mockData = {
    users: [
      { id: 1, name: 'Test User', email: 'user@test.com', phone: '+1234567890', verified: true },
      { id: 2, name: 'John Driver', email: 'driver@test.com', phone: '+1234567891', car_info: 'Toyota Prius', verified: true }
    ],
    drivers: [
      { id: 1, name: 'John Driver', email: 'driver@test.com', phone: '+1234567891', car_info: 'Toyota Prius', verified: true, available: true }
    ],
    rides: [
      { id: 1, user_id: 1, driver_id: 1, pickup: '123 Main St', destination: '456 Oak Ave', status: 'completed', fare: 25.50 }
    ]
  };

  // Apply security middleware
  app.use(helmet(helmetConfig));
  app.use(cors(corsOptions));
  app.use(securityHeaders);
  app.use(limitRequestSize);
  app.use(sanitizeInput);
  app.use(requestLogger);

  // Apply performance monitoring middleware
  app.use(performanceMiddleware());

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Logging middleware
  app.use(morgan('combined'));

  // Apply rate limiting
  app.use(rateLimiters.global);

  // --- Authentication Routes (with auth rate limiting) ---
  app.use('/api/auth/user', rateLimiters.auth, authUser);
  app.use('/api/auth/driver', rateLimiters.auth, authDriver);

  // Token refresh endpoint
  app.post('/api/auth/refresh', rateLimiters.auth, refreshToken());

  // Logout endpoint
  app.post('/api/auth/logout', auth(), logout());

  // --- Protected Routes ---
  app.use('/api/users', auth('user'), userRoutes);
  app.use('/api/drivers', auth('driver'), driverRoutes);
  app.use('/api/rides', auth(), rideRoutes);

  // --- Admin Routes (with API key validation) ---
  app.use('/api/admin', validateApiKey, auth('admin'), adminRoutes);

  // --- Analytics Routes (with API key validation) ---
  app.use('/api/analytics', validateApiKey, auth(), analyticsRoutes);

  // --- Safety Routes ---
  app.use('/api/safety', auth(), safetyRoutes);

  // --- Performance Routes (admin only) ---
  app.use('/api/performance', validateApiKey, auth('admin'), performanceRoutes);

  // --- API Routes ---
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Ride Share API is working',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      mode: process.env.NODE_ENV || 'development'
    });
  });

  // Enhanced health check endpoint
  app.get('/health', async (req, res) => {
    try {
      let dbHealth;
      try {
        dbHealth = await healthCheck();
      } catch (dbError) {
        dbHealth = {
          status: 'unavailable',
          error: dbError.message,
          message: 'Database connection failed - using mock data'
        };
      }
      
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: dbHealth,
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Development endpoints for testing
  if (process.env.NODE_ENV === 'development') {
    app.get('/api/dev/mock-data', (req, res) => {
      res.json(mockData);
    });
    
    app.post('/api/dev/reset', (req, res) => {
      rideIdCounter = 1;
      pendingRides = {};
      availableDrivers = {};
      res.json({ message: 'Mock data reset' });
    });
    
    // Development endpoint to test authentication
    app.get('/api/dev/test-auth', auth(), (req, res) => {
      res.json({
        message: 'Authentication working',
        user: req.user,
        token: req.token
      });
    });
  }

  // Swagger setup
  const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'Ride Share App API',
      version: '1.0.0',
      description: 'API documentation for the Ride Share App backend with enhanced security features.'
    },
    servers: [
      { url: 'http://localhost:3000' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        }
      }
    },
    security: [
      {
        bearerAuth: [],
        apiKeyAuth: []
      }
    ]
  };
  const options = {
    swaggerDefinition,
    apis: ['./routes/*.js'],
  };
  const swaggerSpec = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Database connection check with retry logic and fallback
  const checkDatabaseConnection = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
      try {
        const result = await secureQuery('SELECT NOW() as now');
        console.log('✅ Database connected successfully:', result.rows[0].now);
        return true;
      } catch (err) {
        console.error(`❌ Database connection attempt ${i + 1} failed:`, err.message);
        if (i === retries - 1) {
          console.error('❌ All database connection attempts failed');
          console.log('🔄 Using mock database for development...');
          return false;
        }
        // Wait 2 seconds before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  // Initialize database connection
  checkDatabaseConnection();

  // Error handling middleware (must be last)
  app.use(globalErrorHandler);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      error: 'Endpoint not found',
      code: 'ENDPOINT_NOT_FOUND',
      path: req.originalUrl
    });
  });

  // Server startup function
  const startServer = async (initialPort) => {
    let port = initialPort;
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await new Promise((resolve, reject) => {
          server.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
            console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
            console.log(`🏥 Health Check: http://localhost:${port}/health`);
            resolve();
          });

          server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
              console.log(`⚠️ Port ${port} is busy, trying ${port + 1}...`);
              port++;
              reject(error);
            } else {
              console.error('❌ Server error:', error);
              reject(error);
            }
          });
        });

        // If we get here, the server started successfully
        break;
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          console.error('❌ Failed to start server after multiple attempts');
          process.exit(1);
        }
        // Continue to next attempt
      }
    }
  };

  // Start server if this file is run directly
  if (require.main === module) {
    const port = process.env.PORT || 3000;
    console.log('✅ [DEBUG] About to start server on port', port);
    startServer(port);
    console.log('✅ [DEBUG] startServer called.');
  }

  console.log('✅ [DEBUG] End of server.js main block.');

  module.exports = app;

  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var in production

} catch (err) {
  console.error('❌ Error during server startup:', err);
  process.exit(1);
}
// --- END: Safe require block ---
