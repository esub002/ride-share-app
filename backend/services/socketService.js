/**
 * Advanced Socket.IO Service
 * Enhanced real-time features with room-based messaging, connection pooling, and message queuing
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { logEvent } = require('../utils/log');
const { secureQuery, transaction } = require('../middleware/database');
const { generateToken, verifyToken } = require('../middleware/auth');

class SocketService {
  constructor(server) {
    this.io = null;
    this.server = server;
    this.rooms = new Map();
    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId
    this.offlineMessages = new Map(); // userId -> messages[]
    this.locationUpdates = new Map(); // userId -> location
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      peakConnections: 0
    };
    
    this.initialize();
  }

  initialize() {
    try {
      this.io = new Server(this.server, {
        cors: {
          origin: process.env.CORS_ORIGINS ? 
            process.env.CORS_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:19006', 'exp://localhost:19000'],
          credentials: true
        },
        transports: ['websocket', 'polling'],
        pingTimeout: 60000,
        pingInterval: 25000,
        maxHttpBufferSize: 1e6, // 1MB
        allowEIO3: true
      });

      this.setupEventHandlers();
      this.setupMiddleware();
      this.startCleanupInterval();
      
      console.log('✅ Socket.IO service initialized successfully');
    } catch (error) {
      console.error('❌ Socket.IO initialization failed:', error);
      this.io = null;
    }
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyToken(token, 'access');
        socket.userId = decoded.userId || decoded.driverId;
        socket.userRole = decoded.role;
        socket.userPermissions = decoded.permissions || [];
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    // Rate limiting middleware
    this.io.use((socket, next) => {
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const maxEvents = 100;

      if (!socket.rateLimit) {
        socket.rateLimit = {
          events: [],
          lastReset: now
        };
      }

      // Reset counter if window has passed
      if (now - socket.rateLimit.lastReset > windowMs) {
        socket.rateLimit.events = [];
        socket.rateLimit.lastReset = now;
      }

      // Check rate limit
      if (socket.rateLimit.events.length >= maxEvents) {
        return next(new Error('Rate limit exceeded'));
      }

      socket.rateLimit.events.push(now);
      next();
    });
  }

  setupEventHandlers() {
    this.io.on('connection', async (socket) => {
      try {
        await this.handleConnection(socket);
      } catch (error) {
        console.error('Connection error:', error);
        socket.disconnect();
      }
    });
  }

  async handleConnection(socket) {
    const { userId, userRole } = socket;
    
    // Update connection stats
    this.connectionStats.totalConnections++;
    this.connectionStats.activeConnections++;
    this.connectionStats.peakConnections = Math.max(
      this.connectionStats.peakConnections, 
      this.connectionStats.activeConnections
    );

    // Store socket mappings
    this.userSockets.set(userId, socket.id);
    this.socketUsers.set(socket.id, userId);

    // Join user-specific room
    const userRoom = `user:${userId}`;
    await socket.join(userRoom);
    this.rooms.set(userRoom, { type: 'user', userId, socketIds: [socket.id] });

    // Join role-specific room
    const roleRoom = `role:${userRole}`;
    await socket.join(roleRoom);
    
    // Join location-based room (if driver)
    if (userRole === 'driver') {
      await socket.join('drivers:available');
    }

    // Send offline messages
    await this.sendOfflineMessages(userId, socket);

    // Update user status
    await this.updateUserStatus(userId, 'online');

    logEvent('socket_connected', {
      socketId: socket.id,
      userId,
      userRole,
      timestamp: new Date().toISOString()
    });

    console.log(`🔌 Client connected: ${socket.id} (User: ${userId}, Role: ${userRole})`);

    // Setup event handlers
    this.setupSocketEventHandlers(socket);

    // Handle disconnection
    socket.on('disconnect', async (reason) => {
      await this.handleDisconnection(socket, reason);
    });
  }

  setupSocketEventHandlers(socket) {
    const { userId, userRole } = socket;

    // Driver availability
    socket.on('driver:available', async (data) => {
      try {
        await this.handleDriverAvailable(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to update availability', code: 'AVAILABILITY_ERROR' });
      }
    });

    // Driver unavailable
    socket.on('driver:unavailable', async (data) => {
      try {
        await this.handleDriverUnavailable(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to update availability', code: 'AVAILABILITY_ERROR' });
      }
    });

    // Location updates
    socket.on('location:update', async (data) => {
      try {
        await this.handleLocationUpdate(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to update location', code: 'LOCATION_ERROR' });
      }
    });

    // Ride requests
    socket.on('ride:request', async (data) => {
      try {
        await this.handleRideRequest(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to request ride', code: 'RIDE_REQUEST_ERROR' });
      }
    });

    // Ride acceptance
    socket.on('ride:accept', async (data) => {
      try {
        await this.handleRideAccept(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to accept ride', code: 'RIDE_ACCEPT_ERROR' });
      }
    });

    // Ride completion
    socket.on('ride:complete', async (data) => {
      try {
        await this.handleRideComplete(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to complete ride', code: 'RIDE_COMPLETE_ERROR' });
      }
    });

    // Ride cancellation
    socket.on('ride:cancel', async (data) => {
      try {
        await this.handleRideCancel(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to cancel ride', code: 'RIDE_CANCEL_ERROR' });
      }
    });

    // Real-time messaging
    socket.on('message:send', async (data) => {
      try {
        await this.handleMessageSend(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message', code: 'MESSAGE_ERROR' });
      }
    });

    // Emergency alerts
    socket.on('emergency:alert', async (data) => {
      try {
        await this.handleEmergencyAlert(socket, data);
      } catch (error) {
        socket.emit('error', { message: 'Failed to send emergency alert', code: 'EMERGENCY_ERROR' });
      }
    });

    // Typing indicators
    socket.on('typing:start', (data) => {
      this.handleTypingStart(socket, data);
    });

    socket.on('typing:stop', (data) => {
      this.handleTypingStop(socket, data);
    });

    // Heartbeat
    socket.on('heartbeat', () => {
      socket.emit('heartbeat:ack');
    });
  }

  async handleDriverAvailable(socket, data) {
    const { userId, userRole } = socket;
    
    if (userRole !== 'driver') {
      socket.emit('error', { message: 'Only drivers can update availability', code: 'UNAUTHORIZED' });
      return;
    }

    // Update driver status in database
    await secureQuery(
      'UPDATE drivers SET available = TRUE, last_available = NOW() WHERE id = $1',
      [userId]
    );

    // Join available drivers room
    await socket.join('drivers:available');

    // Broadcast to all riders
    this.io.to('role:user').emit('driver:status', {
      driverId: userId,
      available: true,
      timestamp: new Date().toISOString()
    });

    logEvent('driver_available', {
      driverId: userId,
      timestamp: new Date().toISOString()
    });

    socket.emit('driver:available:confirmed');
  }

  async handleDriverUnavailable(socket, data) {
    const { userId, userRole } = socket;
    
    if (userRole !== 'driver') {
      socket.emit('error', { message: 'Only drivers can update availability', code: 'UNAUTHORIZED' });
      return;
    }

    // Update driver status in database
    await secureQuery(
      'UPDATE drivers SET available = FALSE, last_available = NOW() WHERE id = $1',
      [userId]
    );

    // Leave available drivers room
    await socket.leave('drivers:available');

    // Broadcast to all riders
    this.io.to('role:user').emit('driver:status', {
      driverId: userId,
      available: false,
      timestamp: new Date().toISOString()
    });

    logEvent('driver_unavailable', {
      driverId: userId,
      timestamp: new Date().toISOString()
    });

    socket.emit('driver:unavailable:confirmed');
  }

  async handleLocationUpdate(socket, data) {
    const { userId, userRole } = socket;
    const { latitude, longitude, accuracy, speed, heading } = data;

    // Validate coordinates
    if (!latitude || !longitude || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      socket.emit('error', { message: 'Invalid coordinates', code: 'INVALID_COORDINATES' });
      return;
    }

    // Store location update
    this.locationUpdates.set(userId, {
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      timestamp: new Date().toISOString()
    });

    // Update location in database
    const table = userRole === 'driver' ? 'drivers' : 'users';
    await secureQuery(
      `UPDATE ${table} SET 
       current_latitude = $1, 
       current_longitude = $2, 
       location_accuracy = $3,
       location_updated_at = NOW() 
       WHERE id = $4`,
      [latitude, longitude, accuracy, userId]
    );

    // Broadcast to relevant parties
    if (userRole === 'driver') {
      // Broadcast to riders who have active rides with this driver
      const activeRides = await secureQuery(
        'SELECT rider_id FROM rides WHERE driver_id = $1 AND status IN ($2, $3)',
        [userId, 'accepted', 'in_progress']
      );

      activeRides.rows.forEach(ride => {
        this.io.to(`user:${ride.rider_id}`).emit('driver:location', {
          driverId: userId,
          latitude,
          longitude,
          accuracy,
          speed,
          heading,
          timestamp: new Date().toISOString()
        });
      });
    } else {
      // Broadcast to driver if user has active ride
      const activeRide = await secureQuery(
        'SELECT driver_id FROM rides WHERE rider_id = $1 AND status IN ($2, $3)',
        [userId, 'accepted', 'in_progress']
      );

      if (activeRide.rows.length > 0) {
        this.io.to(`user:${activeRide.rows[0].driver_id}`).emit('rider:location', {
          riderId: userId,
          latitude,
          longitude,
          accuracy,
          timestamp: new Date().toISOString()
        });
      }
    }

    logEvent('location_updated', {
      userId,
      userRole,
      latitude,
      longitude,
      timestamp: new Date().toISOString()
    });
  }

  async handleRideRequest(socket, data) {
    const { userId, userRole } = socket;
    const { pickup, destination, estimatedFare, paymentMethod } = data;

    if (userRole !== 'user') {
      socket.emit('error', { message: 'Only riders can request rides', code: 'UNAUTHORIZED' });
      return;
    }

    // Create ride request in database
    const rideResult = await secureQuery(
      `INSERT INTO rides (rider_id, pickup_location, destination_location, estimated_fare, payment_method, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, 'pending', NOW()) 
       RETURNING id`,
      [userId, pickup, destination, estimatedFare, paymentMethod]
    );

    const rideId = rideResult.rows[0].id;

    // Find available drivers
    const availableDrivers = await secureQuery(
      'SELECT id, current_latitude, current_longitude FROM drivers WHERE available = TRUE AND verified = TRUE',
      []
    );

    if (availableDrivers.rows.length === 0) {
      socket.emit('ride:noDrivers', { rideId });
      return;
    }

    // Notify all available drivers
    this.io.to('drivers:available').emit('ride:request', {
      rideId,
      riderId: userId,
      pickup,
      destination,
      estimatedFare,
      paymentMethod,
      timestamp: new Date().toISOString()
    });

    // Set timeout for ride acceptance
    setTimeout(async () => {
      const ride = await secureQuery('SELECT status FROM rides WHERE id = $1', [rideId]);
      if (ride.rows[0]?.status === 'pending') {
        socket.emit('ride:timeout', { rideId });
        await secureQuery('UPDATE rides SET status = $1 WHERE id = $2', ['timeout', rideId]);
      }
    }, 30000); // 30 seconds timeout

    logEvent('ride_requested', {
      rideId,
      riderId: userId,
      pickup,
      destination,
      estimatedFare,
      timestamp: new Date().toISOString()
    });
  }

  async handleRideAccept(socket, data) {
    const { userId, userRole } = socket;
    const { rideId } = data;

    if (userRole !== 'driver') {
      socket.emit('error', { message: 'Only drivers can accept rides', code: 'UNAUTHORIZED' });
      return;
    }

    // Update ride status
    const result = await secureQuery(
      'UPDATE rides SET driver_id = $1, status = $2, accepted_at = NOW() WHERE id = $3 AND status = $4 RETURNING rider_id',
      [userId, 'accepted', rideId, 'pending']
    );

    if (result.rows.length === 0) {
      socket.emit('error', { message: 'Ride not available', code: 'RIDE_UNAVAILABLE' });
      return;
    }

    const riderId = result.rows[0].rider_id;

    // Notify rider
    this.io.to(`user:${riderId}`).emit('ride:accepted', {
      rideId,
      driverId: userId,
      timestamp: new Date().toISOString()
    });

    // Create ride room
    const rideRoom = `ride:${rideId}`;
    await socket.join(rideRoom);
    this.io.to(`user:${riderId}`).socketsJoin(rideRoom);

    logEvent('ride_accepted', {
      rideId,
      driverId: userId,
      riderId,
      timestamp: new Date().toISOString()
    });

    socket.emit('ride:accept:confirmed', { rideId });
  }

  async handleRideComplete(socket, data) {
    const { userId, userRole } = socket;
    const { rideId, actualFare, rating, review } = data;

    if (userRole !== 'driver') {
      socket.emit('error', { message: 'Only drivers can complete rides', code: 'UNAUTHORIZED' });
      return;
    }

    // Update ride status
    const result = await secureQuery(
      'UPDATE rides SET status = $1, actual_fare = $2, completed_at = NOW() WHERE id = $3 AND driver_id = $4 RETURNING rider_id',
      ['completed', actualFare, rideId, userId]
    );

    if (result.rows.length === 0) {
      socket.emit('error', { message: 'Ride not found', code: 'RIDE_NOT_FOUND' });
      return;
    }

    const riderId = result.rows[0].rider_id;

    // Notify rider
    this.io.to(`user:${riderId}`).emit('ride:completed', {
      rideId,
      driverId: userId,
      actualFare,
      timestamp: new Date().toISOString()
    });

    // Leave ride room
    const rideRoom = `ride:${rideId}`;
    await socket.leave(rideRoom);
    this.io.to(`user:${riderId}`).socketsLeave(rideRoom);

    logEvent('ride_completed', {
      rideId,
      driverId: userId,
      riderId,
      actualFare,
      timestamp: new Date().toISOString()
    });

    socket.emit('ride:complete:confirmed', { rideId });
  }

  async handleRideCancel(socket, data) {
    const { userId, userRole } = socket;
    const { rideId, reason } = data;

    // Check if user is authorized to cancel this ride
    const ride = await secureQuery(
      'SELECT rider_id, driver_id, status FROM rides WHERE id = $1',
      [rideId]
    );

    if (ride.rows.length === 0) {
      socket.emit('error', { message: 'Ride not found', code: 'RIDE_NOT_FOUND' });
      return;
    }

    const rideData = ride.rows[0];
    const canCancel = (userRole === 'user' && rideData.rider_id === userId) ||
                     (userRole === 'driver' && rideData.driver_id === userId);

    if (!canCancel) {
      socket.emit('error', { message: 'Not authorized to cancel this ride', code: 'UNAUTHORIZED' });
      return;
    }

    // Update ride status
    await secureQuery(
      'UPDATE rides SET status = $1, cancelled_at = NOW(), cancellation_reason = $2 WHERE id = $3',
      ['cancelled', reason, rideId]
    );

    // Notify other party
    const otherUserId = userRole === 'user' ? rideData.driver_id : rideData.rider_id;
    if (otherUserId) {
      this.io.to(`user:${otherUserId}`).emit('ride:cancelled', {
        rideId,
        cancelledBy: userId,
        reason,
        timestamp: new Date().toISOString()
      });
    }

    // Leave ride room
    const rideRoom = `ride:${rideId}`;
    await socket.leave(rideRoom);
    if (otherUserId) {
      this.io.to(`user:${otherUserId}`).socketsLeave(rideRoom);
    }

    logEvent('ride_cancelled', {
      rideId,
      cancelledBy: userId,
      reason,
      timestamp: new Date().toISOString()
    });

    socket.emit('ride:cancel:confirmed', { rideId });
  }

  async handleMessageSend(socket, data) {
    const { userId, userRole } = socket;
    const { rideId, message, messageType = 'text' } = data;

    // Verify user is part of this ride
    const ride = await secureQuery(
      'SELECT rider_id, driver_id, status FROM rides WHERE id = $1',
      [rideId]
    );

    if (ride.rows.length === 0) {
      socket.emit('error', { message: 'Ride not found', code: 'RIDE_NOT_FOUND' });
      return;
    }

    const rideData = ride.rows[0];
    const isParticipant = (userRole === 'user' && rideData.rider_id === userId) ||
                         (userRole === 'driver' && rideData.driver_id === userId);

    if (!isParticipant) {
      socket.emit('error', { message: 'Not authorized to send messages for this ride', code: 'UNAUTHORIZED' });
      return;
    }

    // Store message in database
    const messageResult = await secureQuery(
      `INSERT INTO ride_messages (ride_id, sender_id, sender_role, message, message_type, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id`,
      [rideId, userId, userRole, message, messageType]
    );

    const messageId = messageResult.rows[0].id;

    // Broadcast to ride room
    const messageData = {
      messageId,
      rideId,
      senderId: userId,
      senderRole: userRole,
      message,
      messageType,
      timestamp: new Date().toISOString()
    };

    this.io.to(`ride:${rideId}`).emit('message:received', messageData);

    logEvent('message_sent', {
      messageId,
      rideId,
      senderId: userId,
      senderRole: userRole,
      messageType,
      timestamp: new Date().toISOString()
    });
  }

  async handleEmergencyAlert(socket, data) {
    const { userId, userRole } = socket;
    const { rideId, emergencyType, location, description } = data;

    // Verify user is part of this ride
    const ride = await secureQuery(
      'SELECT rider_id, driver_id FROM rides WHERE id = $1',
      [rideId]
    );

    if (ride.rows.length === 0) {
      socket.emit('error', { message: 'Ride not found', code: 'RIDE_NOT_FOUND' });
      return;
    }

    // Store emergency alert
    await secureQuery(
      `INSERT INTO emergency_alerts (ride_id, reporter_id, reporter_role, emergency_type, location, description, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [rideId, userId, userRole, emergencyType, location, description]
    );

    // Notify emergency services and relevant parties
    this.io.to('role:admin').emit('emergency:alert', {
      rideId,
      reporterId: userId,
      reporterRole: userRole,
      emergencyType,
      location,
      description,
      timestamp: new Date().toISOString()
    });

    logEvent('emergency_alert', {
      rideId,
      reporterId: userId,
      reporterRole: userRole,
      emergencyType,
      timestamp: new Date().toISOString()
    });

    socket.emit('emergency:alert:sent');
  }

  handleTypingStart(socket, data) {
    const { rideId } = data;
    const { userId, userRole } = socket;

    this.io.to(`ride:${rideId}`).emit('typing:start', {
      rideId,
      userId,
      userRole,
      timestamp: new Date().toISOString()
    });
  }

  handleTypingStop(socket, data) {
    const { rideId } = data;
    const { userId, userRole } = socket;

    this.io.to(`ride:${rideId}`).emit('typing:stop', {
      rideId,
      userId,
      userRole,
      timestamp: new Date().toISOString()
    });
  }

  async handleDisconnection(socket, reason) {
    const { userId, userRole } = socket;

    // Update connection stats
    this.connectionStats.activeConnections--;

    // Remove socket mappings
    this.userSockets.delete(userId);
    this.socketUsers.delete(socket.id);

    // Update user status
    await this.updateUserStatus(userId, 'offline');

    // Remove from available drivers if applicable
    if (userRole === 'driver') {
      await secureQuery(
        'UPDATE drivers SET available = FALSE WHERE id = $1',
        [userId]
      );

      this.io.to('role:user').emit('driver:status', {
        driverId: userId,
        available: false,
        timestamp: new Date().toISOString()
      });
    }

    logEvent('socket_disconnected', {
      socketId: socket.id,
      userId,
      userRole,
      reason,
      timestamp: new Date().toISOString()
    });

    console.log(`🔌 Client disconnected: ${socket.id} (User: ${userId}, Reason: ${reason})`);
  }

  async updateUserStatus(userId, status) {
    try {
      await secureQuery(
        'UPDATE users SET online_status = $1, last_seen = NOW() WHERE id = $1',
        [status, userId]
      );
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  }

  async sendOfflineMessages(userId, socket) {
    const offlineMessages = this.offlineMessages.get(userId) || [];
    
    if (offlineMessages.length > 0) {
      socket.emit('messages:offline', offlineMessages);
      this.offlineMessages.delete(userId);
    }
  }

  // Public methods for external use
  getIO() {
    return this.io;
  }

  getConnectionStats() {
    return { ...this.connectionStats };
  }

  getActiveUsers() {
    return Array.from(this.userSockets.keys());
  }

  getLocationUpdates() {
    return new Map(this.locationUpdates);
  }

  // Send message to specific user
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    } else {
      // Store for offline delivery
      const offlineMessages = this.offlineMessages.get(userId) || [];
      offlineMessages.push({ event, data, timestamp: new Date().toISOString() });
      this.offlineMessages.set(userId, offlineMessages);
    }
  }

  // Send message to all users with specific role
  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, data);
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  startCleanupInterval() {
    // Clean up old location updates every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [userId, location] of this.locationUpdates) {
        const locationTime = new Date(location.timestamp).getTime();
        if (now - locationTime > 300000) { // 5 minutes
          this.locationUpdates.delete(userId);
        }
      }
    }, 300000);

    // Clean up old offline messages every hour
    setInterval(() => {
      const now = Date.now();
      for (const [userId, messages] of this.offlineMessages) {
        const filteredMessages = messages.filter(msg => {
          const msgTime = new Date(msg.timestamp).getTime();
          return now - msgTime < 3600000; // 1 hour
        });
        
        if (filteredMessages.length === 0) {
          this.offlineMessages.delete(userId);
        } else {
          this.offlineMessages.set(userId, filteredMessages);
        }
      }
    }, 3600000);
  }
}

module.exports = SocketService; 