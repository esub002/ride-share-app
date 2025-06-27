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
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

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

// In-memory stores
let availableDrivers = {};
let pendingRides = {};
let rideIdCounter = 1;

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

// --- API Routes ---
app.get('/', (req, res) => {
  res.json({ 
    message: 'Ride Share API is working',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

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

// Database connection check with retry logic
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
          // Notify rider
          io.to(pendingRides[acceptedRideId].riderSocketId).emit('ride:assigned', {
            rideId: acceptedRideId,
            driverId: acceptingDriverId,
            origin: pendingRides[acceptedRideId].origin,
            destination: pendingRides[acceptedRideId].destination
          });
          // Remove driver from available
          delete availableDrivers[acceptingDriverId];
        }
      });
    });

    // Listen for driver location updates
    socket.on('driver:location', async ({ driverId, latitude, longitude }) => {
      if (typeof latitude === 'number' && typeof longitude === 'number') {
        try {
          await pool.query('UPDATE drivers SET latitude = $1, longitude = $2 WHERE id = $3', [latitude, longitude, driverId]);
          // Broadcast to all riders/admins (or filter as needed)
          io.emit('driver:locationUpdate', { driverId, latitude, longitude });
        } catch (error) {
          console.error('Error updating driver location:', error);
        }
      }
    });

    // Listen for ride status updates and broadcast to relevant users
    socket.on('ride:statusUpdate', ({ rideId, status, userId, driverId }) => {
      io.emit('ride:status', { rideId, status, userId, driverId });
    });

    // Listen for ride cancellation
    socket.on('ride:cancelled', ({ rideId, userId, driverId }) => {
      io.emit('ride:cancelled', { rideId, userId, driverId });
    });

    // Listen for chat messages
    socket.on('ride:chat', ({ rideId, sender, message }) => {
      io.emit('ride:chat', { rideId, sender, message });
    });

    // Listen for emergency alerts
    socket.on('emergency:alert', ({ driverId, alertType, location, notes }) => {
      console.log(`🚨 Emergency alert from driver ${driverId}: ${alertType}`);
      io.emit('emergency:alert', { driverId, alertType, location, notes, timestamp: new Date().toISOString() });
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
      // Remove driver if present
      for (const [driverId, sockId] of Object.entries(availableDrivers)) {
        if (sockId === socket.id) {
          delete availableDrivers[driverId];
          console.log(`🚗 Driver ${driverId} removed from available list`);
        }
      }
    });
  });
}

// --- Server Startup ---
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Backend API listening on port ${PORT}`);
    console.log(`📖 API Documentation available at http://localhost:${PORT}/api-docs`);
    console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
  });
}

module.exports = app;

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var in production
