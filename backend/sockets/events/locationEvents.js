/**
 * Location-related real-time events
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const { saveLocationUpdateToDB } = require('../../utils/locationPersistence');

function registerLocationEvents(socket, io) {
  // Driver sends location update
  socket.on('location:update', async (payload) => {
    // TODO: Validate payload, throttle updates, etc.
    await saveLocationUpdateToDB(payload);
    io.to(`ride:${payload.rideId}`).emit('location:update', payload);
    // Optionally: io.to(`user:${payload.riderId}`).emit('location:update', payload);
  });
}

module.exports = registerLocationEvents; 