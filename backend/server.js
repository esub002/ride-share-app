// Load environment variables
require('dotenv').config();

// server.js - Main Express app and Socket.IO server
// Sets up routes, middleware, and real-time events

// Basic Express + Socket.IO backend for ride assignment
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db');
const userRoutes = require('./routes/user');
const driverRoutes = require('./routes/driver');
const rideRoutes = require('./routes/ride');
const authUser = require('./routes/authUser');
const authDriver = require('./routes/authDriver');
const auth = require('./middleware/auth');
const morgan = require('morgan');
const cors = require('cors');
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const safetyRoutes = require('./routes/safety');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Set database pool in app.locals for tests
app.locals.pool = pool;

// Initialize Socket.IO with proper error handling
let io;
try {
  io = new Server(server, {
    cors: { origin: '*' }
  });
} catch (error) {
  console.error('Socket.IO initialization error:', error);
  io = null;
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

app.use(express.json());
app.use(morgan('combined'));

// Enhanced CORS configuration
const allowedOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:19006', 'exp://localhost:19000'];

app.use(cors({ 
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true 
}));

// Enhanced security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Global rate limiting middleware
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// --- Middleware ---
app.use('/api/auth/user', authUser);
app.use('/api/auth/driver', authDriver);
app.use('/api/users', auth('user'), userRoutes);
app.use('/api/drivers', auth('driver'), driverRoutes);
app.use('/api/rides', auth(), rideRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/safety', safetyRoutes);

// --- API Routes ---
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ride Share API is working',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    mode: process.env.NODE_ENV || 'development'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: pool ? 'connected' : 'mock'
  });
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
}

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ride Share App API',
    version: '1.0.0',
    description: 'API documentation for the Ride Share App backend with enhanced safety features.'
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
      }
    }
  }
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
      const result = await pool.query('SELECT NOW() as now');
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

// --- Real-time Events ---
if (io) {
  app.set('io', io);

  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // DRIVER: Mark as available
    socket.on('driver:available', ({ driverId }) => {
      availableDrivers[driverId] = socket.id;
      console.log(`🚗 Driver ${driverId} available: ${socket.id}`);
    });

    // RIDER: Request a ride
    socket.on('ride:request', ({ origin, destination, riderId }) => {
      const driverIds = Object.keys(availableDrivers);
      if (driverIds.length === 0) {
        socket.emit('ride:noDrivers');
        return;
      }
      // Assign first available driver
      const driverId = driverIds[0];
      const driverSocketId = availableDrivers[driverId];
      const rideId = rideIdCounter++;
      pendingRides[rideId] = { riderId, driverId, origin, destination, status: 'pending', riderSocketId: socket.id };
      // Notify driver
      io.to(driverSocketId).emit('ride:incoming', { rideId, origin, destination, riderId });
      // Wait for driver to accept
      socket.once('ride:accept', ({ rideId: acceptedRideId, driverId: acceptingDriverId }) => {
        if (pendingRides[acceptedRideId] && pendingRides[acceptedRideId].driverId == acceptingDriverId) {
          pendingRides[acceptedRideId].status = 'accepted';
          const riderSocketId = pendingRides[acceptedRideId].riderSocketId;
          io.to(riderSocketId).emit('ride:accepted', { rideId: acceptedRideId, driverId: acceptingDriverId });
          console.log(`✅ Ride ${acceptedRideId} accepted by driver ${acceptingDriverId}`);
        }
      });
    });

    // DRIVER: Accept ride
    socket.on('ride:accept', ({ rideId, driverId }) => {
      if (pendingRides[rideId] && pendingRides[rideId].driverId == driverId) {
        pendingRides[rideId].status = 'accepted';
        const riderSocketId = pendingRides[rideId].riderSocketId;
        io.to(riderSocketId).emit('ride:accepted', { rideId, driverId });
        console.log(`✅ Ride ${rideId} accepted by driver ${driverId}`);
      }
    });

    // DRIVER: Complete ride
    socket.on('ride:complete', ({ rideId, driverId }) => {
      if (pendingRides[rideId] && pendingRides[rideId].driverId == driverId) {
        pendingRides[rideId].status = 'completed';
        const riderSocketId = pendingRides[rideId].riderSocketId;
        io.to(riderSocketId).emit('ride:completed', { rideId, driverId });
        console.log(`✅ Ride ${rideId} completed by driver ${driverId}`);
        delete pendingRides[rideId];
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      // Remove driver from available list
      Object.keys(availableDrivers).forEach(driverId => {
        if (availableDrivers[driverId] === socket.id) {
          delete availableDrivers[driverId];
          console.log(`🚗 Driver ${driverId} no longer available`);
        }
      });
    });
  });
}

// Start server with port conflict handling
const startServer = async (initialPort) => {
  const maxPortAttempts = 10;
  let currentPort = initialPort;
  
  for (let attempt = 0; attempt < maxPortAttempts; attempt++) {
    try {
      await new Promise((resolve, reject) => {
        const serverInstance = server.listen(currentPort, () => {
          console.log(`🚀 Server running on port ${currentPort}`);
          console.log(`📱 Health check: http://localhost:${currentPort}/health`);
          console.log(`🔗 API docs: http://localhost:${currentPort}/api-docs`);
          console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
          resolve();
        });
        
        serverInstance.on('error', (error) => {
          if (error.code === 'EADDRINUSE') {
            console.log(`⚠️ Port ${currentPort} is in use, trying ${currentPort + 1}...`);
            currentPort++;
            serverInstance.close();
            reject(error);
          } else {
            reject(error);
          }
        });
      });
      
      // If we get here, the server started successfully
      return;
      
    } catch (error) {
      if (error.code === 'EADDRINUSE' && attempt < maxPortAttempts - 1) {
        // Continue to next port
        continue;
      } else {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
      }
    }
  }
  
  console.error('❌ No available ports found');
  process.exit(1);
};

const PORT = process.env.PORT || 3000;
startServer(parseInt(PORT));

module.exports = app;

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var in production
