const pool = require('../db');

async function saveRideStatusToDB({ rideId, status, timestamp }) {
  await pool.query(
    'UPDATE rides SET status = $1, updated_at = $2 WHERE id = $3',
    [status, timestamp || new Date(), rideId]
  );
}

module.exports = { saveRideStatusToDB }; 