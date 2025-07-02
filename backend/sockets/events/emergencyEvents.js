/**
 * Emergency-related real-time events
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const { saveEmergencyAlertToDB } = require('../../utils/emergencyPersistence');

function registerEmergencyEvents(socket, io) {
  // Send emergency alert
  socket.on('emergency:alert', async (payload) => {
    // TODO: Validate payload
    await saveEmergencyAlertToDB(payload);
    io.to('admin').emit('emergency:alert', payload);
    // Optionally: io.to(`ride:${payload.rideId}`).emit('emergency:alert', payload);
  });
}

module.exports = registerEmergencyEvents; 