const pool = require('../db');

async function saveNotificationToDB({ userId, type, message, data, timestamp }) {
  await pool.query(
    'INSERT INTO notifications (user_id, type, message, data, timestamp) VALUES ($1, $2, $3, $4, $5)',
    [userId, type, message, JSON.stringify(data || {}), timestamp || new Date()]
  );
}

module.exports = { saveNotificationToDB }; 