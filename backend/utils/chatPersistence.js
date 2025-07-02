const pool = require('../db');

async function saveChatMessageToDB({ rideId, from, to, message, timestamp }) {
  await pool.query(
    'INSERT INTO chat_messages (ride_id, sender_id, receiver_id, message, timestamp) VALUES ($1, $2, $3, $4, $5)',
    [rideId, from, to, message, timestamp || new Date()]
  );
}

module.exports = { saveChatMessageToDB }; 