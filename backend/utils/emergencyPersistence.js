const pool = require('../db');

async function saveEmergencyAlertToDB({ rideId, userId, location, type, timestamp }) {
  await pool.query(
    'INSERT INTO emergency_alerts (ride_id, user_id, location, type, timestamp) VALUES ($1, $2, $3, $4, $5)',
    [rideId, userId, JSON.stringify(location || {}), type, timestamp || new Date()]
  );
}

module.exports = { saveEmergencyAlertToDB }; 