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
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// In-memory stores
let availableDrivers = {};
let pendingRides = {};
let rideIdCounter = 1;

app.use(express.json());
app.use(morgan('combined'));
const allowedOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(helmet());

// --- Middleware ---
app.use('/api/auth/user', authUser);
app.use('/api/auth/driver', authDriver);
app.use('/api/users', auth('user'), userRoutes);
app.use('/api/drivers', auth('driver'), driverRoutes);
app.use('/api/rides', auth(), rideRoutes);
app.use('/api/admin', adminRoutes);

// --- API Routes ---
app.get('/', (req, res) => {
  res.send('api is working');
});

// Swagger setup
const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Ride Share App API',
    version: '1.0.0',
    description: 'API documentation for the Ride Share App backend.'
  },
  servers: [
    { url: 'http://localhost:3000' }
  ]
};
const options = {
  swaggerDefinition,
  apis: ['./backend/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Example DB query on startup
pool.query('SELECT NOW() as now', (err, res) => {
  if (err) {
    console.error('DB connection error:', err);
  } else {
    console.log('DB connected, time:', res.rows[0].now);
  }
});

// Global rate limiting middleware
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});
app.use(globalLimiter);

// --- Real-time Events ---
app.set('io', io);

io.on('connection', (socket) => {
  // DRIVER: Mark as available
  socket.on('driver:available', ({ driverId }) => {
    availableDrivers[driverId] = socket.id;
    console.log(`Driver ${driverId} available: ${socket.id}`);
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
      await pool.query('UPDATE drivers SET latitude = $1, longitude = $2 WHERE id = $3', [latitude, longitude, driverId]);
      // Broadcast to all riders/admins (or filter as needed)
      io.emit('driver:locationUpdate', { driverId, latitude, longitude });
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

  // Clean up on disconnect
  socket.on('disconnect', () => {
    // Remove driver if present
    for (const [driverId, sockId] of Object.entries(availableDrivers)) {
      if (sockId === socket.id) {
        delete availableDrivers[driverId];
      }
    }
  });
});

// --- Server Startup ---
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Backend API listening on port ${PORT}`);
  });
}

module.exports = app;

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var in production
