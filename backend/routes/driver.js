// driver.js - Driver CRUD, location, and related endpoints
const { auth } = require('../middleware/auth');
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const router = express.Router();

/**
 * @swagger
 * /api/drivers:
 *   get:
 *     summary: Get all drivers
 *     tags: [Drivers]
 *     responses:
 *       200:
 *         description: List of drivers
 *   post:
 *     summary: Create a new driver
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               car_info:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver created
 * /api/drivers/{id}/location:
 *   put:
 *     summary: Update driver location
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated
 * /api/drivers/locations:
 *   get:
 *     summary: Get all driver locations
 *     tags: [Drivers]
 *     responses:
 *       200:
 *         description: List of driver locations
 */

// Create driver
router.post(
  '/',
  [
    body('name').isLength({ min: 2 }),
    body('car_info').optional().isString(),
    body('available').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, car_info, available } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO drivers (name, car_info, available) VALUES ($1, $2, $3) RETURNING *',
        [name, car_info, available]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get all drivers
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, name } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM drivers';
  let params = [];
  if (name) {
    query += ' WHERE name ILIKE $1';
    params.push(`%${name}%`);
  }
  query += ' ORDER BY id LIMIT $2 OFFSET $3';
  params.push(limit, offset);
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Get driver by id
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});

// Update driver
router.put(
  '/:id',
  [
    body('name').isLength({ min: 2 }),
    body('car_info').optional().isString(),
    body('available').optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, car_info, available } = req.body;
    const result = await pool.query(
      'UPDATE drivers SET name = $1, car_info = $2, available = $3 WHERE id = $4 RETURNING *',
      [name, car_info, available, req.params.id]
    );
    res.json(result.rows[0]);
  }
);

// Delete driver
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM drivers WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Update driver location
router.put('/:id/location', auth('driver'), async (req, res) => {
  const { latitude, longitude } = req.body;
  const { id } = req.params;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  await pool.query('UPDATE drivers SET latitude = $1, longitude = $2 WHERE id = $3', [latitude, longitude, id]);
  res.json({ message: 'Location updated' });
});

// Get all driver locations
router.get('/locations', auth('admin'), async (req, res) => {
  const result = await pool.query('SELECT id, name, latitude, longitude, available FROM drivers WHERE latitude IS NOT NULL AND longitude IS NOT NULL');
  res.json(result.rows);
});

// PATCH /api/drivers/:id/availability - Toggle driver availability
router.patch('/:id/availability', auth('driver'), async (req, res) => {
  const { id } = req.params;
  const { available } = req.body;
  await pool.query('UPDATE drivers SET available = $1 WHERE id = $2', [available, id]);
  res.json({ success: true });
});

// ===== SAFETY FEATURES =====

// Emergency Contacts
router.get('/:id/emergency-contacts', auth('driver'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM emergency_contacts WHERE driver_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

router.post('/:id/emergency-contacts', auth('driver'), async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO emergency_contacts (driver_id, name, phone, relationship) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.params.id, name, phone, relationship]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ error: 'Failed to add emergency contact' });
  }
});

// Safety Settings
router.get('/:id/safety-settings', auth('driver'), async (req, res) => {
  try {
    let { rows } = await pool.query(
      'SELECT * FROM safety_settings WHERE driver_id = $1',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      // Create default settings if none exist
      const { rows: newSettings } = await pool.query(
        `INSERT INTO safety_settings (driver_id, auto_share_location, emergency_alerts, ride_sharing, background_tracking, voice_commands, panic_button_enabled) 
         VALUES ($1, true, true, true, true, true, true) RETURNING *`,
        [req.params.id]
      );
      rows = newSettings;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching safety settings:', error);
    res.status(500).json({ error: 'Failed to fetch safety settings' });
  }
});

router.put('/:id/safety-settings', auth('driver'), async (req, res) => {
  try {
    const {
      auto_share_location,
      emergency_alerts,
      ride_sharing,
      background_tracking,
      voice_commands,
      panic_button_enabled,
      auto_sos,
      night_mode,
      silent_mode
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO safety_settings (driver_id, auto_share_location, emergency_alerts, ride_sharing, background_tracking, voice_commands, panic_button_enabled, auto_sos, night_mode, silent_mode) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (driver_id) 
       DO UPDATE SET 
         auto_share_location = EXCLUDED.auto_share_location,
         emergency_alerts = EXCLUDED.emergency_alerts,
         ride_sharing = EXCLUDED.ride_sharing,
         background_tracking = EXCLUDED.background_tracking,
         voice_commands = EXCLUDED.voice_commands,
         panic_button_enabled = EXCLUDED.panic_button_enabled,
         auto_sos = EXCLUDED.auto_sos,
         night_mode = EXCLUDED.night_mode,
         silent_mode = EXCLUDED.silent_mode,
         updated_at = NOW()
       RETURNING *`,
      [req.params.id, auto_share_location, emergency_alerts, ride_sharing, background_tracking, voice_commands, panic_button_enabled, auto_sos, night_mode, silent_mode]
    );
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating safety settings:', error);
    res.status(500).json({ error: 'Failed to update safety settings' });
  }
});

// Incident Reports
router.get('/:id/incident-reports', auth('driver'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM incident_reports WHERE driver_id = $1 ORDER BY reported_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching incident reports:', error);
    res.status(500).json({ error: 'Failed to fetch incident reports' });
  }
});

router.post('/:id/incident-reports', auth('driver'), async (req, res) => {
  try {
    const { type, description, severity, location_latitude, location_longitude, ride_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO incident_reports (driver_id, ride_id, type, description, severity, location_latitude, location_longitude) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, ride_id, type, description, severity, location_latitude, location_longitude]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, message_content) 
       VALUES ($1, $2, 'incident_report', 'admin', $3)`,
      [req.params.id, ride_id, `Incident reported: ${type} - ${description}`]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating incident report:', error);
    res.status(500).json({ error: 'Failed to create incident report' });
  }
});

// Emergency Alerts
router.post('/:id/emergency-alerts', auth('driver'), async (req, res) => {
  try {
    const { alert_type, location_latitude, location_longitude, ride_id, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO emergency_alerts (driver_id, ride_id, alert_type, location_latitude, location_longitude, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.params.id, ride_id, alert_type, location_latitude, location_longitude, notes]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, message_content) 
       VALUES ($1, $2, 'emergency_alert', 'emergency_services', $3)`,
      [req.params.id, ride_id, `Emergency alert triggered: ${alert_type}`]
    );
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('emergency:alert', {
      driverId: req.params.id,
      alertType: alert_type,
      location: { latitude: location_latitude, longitude: location_longitude },
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating emergency alert:', error);
    res.status(500).json({ error: 'Failed to create emergency alert' });
  }
});

// Location Sharing
router.post('/:id/share-location', auth('driver'), async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading, altitude, ride_id, shared_with } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO location_sharing (driver_id, ride_id, latitude, longitude, accuracy, speed, heading, altitude, shared_with) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.params.id, ride_id, latitude, longitude, accuracy, speed, heading, altitude, shared_with]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, recipient_details, message_content) 
       VALUES ($1, $2, 'location_shared', 'contacts', $3, 'Location shared with emergency contacts')`,
      [req.params.id, ride_id, shared_with]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error sharing location:', error);
    res.status(500).json({ error: 'Failed to share location' });
  }
});

// Trip Sharing
router.post('/:id/share-trip', auth('driver'), async (req, res) => {
  try {
    const { 
      ride_id, 
      pickup_address, 
      destination_address, 
      estimated_arrival, 
      current_location_latitude, 
      current_location_longitude, 
      shared_with 
    } = req.body;
    
    const { rows } = await pool.query(
      `INSERT INTO trip_sharing (driver_id, ride_id, pickup_address, destination_address, estimated_arrival, current_location_latitude, current_location_longitude, shared_with) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.params.id, ride_id, pickup_address, destination_address, estimated_arrival, current_location_latitude, current_location_longitude, shared_with]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, recipient_details, message_content) 
       VALUES ($1, $2, 'trip_update', 'contacts', $3, 'Trip status shared with emergency contacts')`,
      [req.params.id, ride_id, shared_with]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error sharing trip:', error);
    res.status(500).json({ error: 'Failed to share trip' });
  }
});

// Communication History
router.get('/:id/communication-history', auth('driver'), async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM communication_history WHERE driver_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3',
      [req.params.id, limit, offset]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ error: 'Failed to fetch communication history' });
  }
});

// Safety Metrics
router.get('/:id/safety-metrics', auth('driver'), async (req, res) => {
  try {
    let { rows } = await pool.query(
      'SELECT * FROM safety_metrics WHERE driver_id = $1',
      [req.params.id]
    );
    
    if (rows.length === 0) {
      // Create default metrics if none exist
      const { rows: newMetrics } = await pool.query(
        'INSERT INTO safety_metrics (driver_id, total_rides, safe_rides, incidents, average_response_time_seconds, safety_score) VALUES ($1, 0, 0, 0, 0.0, 100) RETURNING *',
        [req.params.id]
      );
      rows = newMetrics;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching safety metrics:', error);
    res.status(500).json({ error: 'Failed to fetch safety metrics' });
  }
});

// Voice Commands Log
router.post('/:id/voice-commands', auth('driver'), async (req, res) => {
  try {
    const { command_text, recognized_command, confidence_score, ride_id, executed, execution_result } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO voice_commands_log (driver_id, ride_id, command_text, recognized_command, confidence_score, executed, execution_result) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.params.id, ride_id, command_text, recognized_command, confidence_score, executed, execution_result]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error logging voice command:', error);
    res.status(500).json({ error: 'Failed to log voice command' });
  }
});

module.exports = router;
