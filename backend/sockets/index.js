/**
 * Main Socket.IO setup
 * Loads all modular event handlers and integrates Redis adapter
 */
const registerRideEvents = require('./events/rideEvents');
const registerLocationEvents = require('./events/locationEvents');
const registerNotificationEvents = require('./events/notificationEvents');
const registerChatEvents = require('./events/chatEvents');
const registerEmergencyEvents = require('./events/emergencyEvents');
const { setupRedisAdapter } = require('./redisAdapter');
const { verifyToken } = require('../middleware/auth');

function setupSocketIO(io) {
  setupRedisAdapter(io);

  io.use(async (socket, next) => {
    try {
      // Extract token from handshake
      const token = socket.handshake.auth.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(new Error('Authentication token required'));
      }
      // Verify token
      const decoded = verifyToken(token, 'access');
      if (!decoded) {
        return next(new Error('Invalid authentication token'));
      }
      // Attach user info to socket
      socket.userId = decoded.userId || decoded.driverId;
      socket.userRole = decoded.role;
      socket.userPermissions = decoded.permissions || [];
      next();
    } catch (err) {
      next(new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    // --- Room joining logic ---
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }
    if (socket.userRole) {
      socket.join(`role:${socket.userRole}`);
      if (socket.userRole === 'admin') {
        socket.join('admin');
      }
      if (socket.userRole === 'driver') {
        socket.join('drivers:available'); // Optionally, only if available
      }
    }
    // Optionally: join ride rooms after ride assignment/acceptance in event handlers

    // Register all modular event handlers
    registerRideEvents(socket, io);
    registerLocationEvents(socket, io);
    registerNotificationEvents(socket, io);
    registerChatEvents(socket, io);
    registerEmergencyEvents(socket, io);
  });
}

module.exports = setupSocketIO; 