const pool = require('../db');

async function saveLocationUpdateToDB({ rideId, driverId, lat, lng, timestamp }) {
  await pool.query(
    'UPDATE rides SET driver_lat = $1, driver_lng = $2, last_location_update = $3 WHERE id = $4',
    [lat, lng, timestamp || new Date(), rideId]
  );
}

module.exports = { saveLocationUpdateToDB }; 