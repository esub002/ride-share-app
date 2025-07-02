/**
 * Ride-related real-time events
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const { saveRideStatusToDB } = require('../../utils/ridePersistence');

function registerRideEvents(socket, io) {
  // Rider requests a ride
  socket.on('ride:request', async (payload) => {
    // TODO: Validate payload, persist to DB, assign rideId, etc.
    socket.join(`ride:${payload.rideId}`);
    io.to('drivers:available').emit('ride:requested', payload);
  });

  // Driver accepts a ride
  socket.on('ride:accept', async (payload) => {
    // TODO: Validate, persist, assign driver, etc.
    socket.join(`ride:${payload.rideId}`);
    io.to(`user:${payload.riderId}`).emit('ride:accepted', payload);
    io.to(`ride:${payload.rideId}`).emit('ride:accepted', payload);
  });

  // Ride status updates (started, completed, cancelled)
  socket.on('ride:status', async (payload) => {
    await saveRideStatusToDB(payload);
    io.to(`user:${payload.riderId}`).emit('ride:status', payload);
    io.to(`user:${payload.driverId}`).emit('ride:status', payload);
    io.to(`ride:${payload.rideId}`).emit('ride:status', payload);
  });
}

module.exports = registerRideEvents; 