/**
 * Notification-related real-time events
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const { saveNotificationToDB } = require('../../utils/notificationPersistence');

function registerNotificationEvents(socket, io) {
  // Send in-app notification
  socket.on('notification:push', async (payload) => {
    // TODO: Validate payload
    await saveNotificationToDB(payload);
    io.to(`user:${payload.userId}`).emit('notification:push', payload);
  });
}

module.exports = registerNotificationEvents; 