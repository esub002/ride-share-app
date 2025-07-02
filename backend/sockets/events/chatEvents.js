/**
 * Chat-related real-time events
 * @param {import('socket.io').Socket} socket
 * @param {import('socket.io').Server} io
 */
const { saveChatMessageToDB } = require('../../utils/chatPersistence');

function registerChatEvents(socket, io) {
  // Send chat message
  socket.on('chat:message', async (payload) => {
    // TODO: Validate payload
    await saveChatMessageToDB(payload);
    io.to(`ride:${payload.rideId}`).emit('chat:message', payload);
  });

  // Typing indicator
  socket.on('chat:typing', (payload) => {
    io.to(`ride:${payload.rideId}`).emit('chat:typing', payload);
  });
}

module.exports = registerChatEvents; 