const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// Emergency Contacts Routes
router.get('/emergency-contacts', auth('driver'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM emergency_contacts WHERE driver_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

router.post('/emergency-contacts', auth('driver'), async (req, res) => {
  try {
    const { name, phone, relationship } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO emergency_contacts (driver_id, name, phone, relationship) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.id, name, phone, relationship]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    res.status(500).json({ error: 'Failed to add emergency contact' });
  }
});

router.put('/emergency-contacts/:id', auth('driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, relationship, is_active } = req.body;
    const { rows } = await pool.query(
      'UPDATE emergency_contacts SET name = $1, phone = $2, relationship = $3, is_active = $4 WHERE id = $5 AND driver_id = $6 RETURNING *',
      [name, phone, relationship, is_active, id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    res.status(500).json({ error: 'Failed to update emergency contact' });
  }
});

router.delete('/emergency-contacts/:id', auth('driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'DELETE FROM emergency_contacts WHERE id = $1 AND driver_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json({ message: 'Contact deleted successfully' });
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    res.status(500).json({ error: 'Failed to delete emergency contact' });
  }
});

// Safety Settings Routes
router.get('/safety-settings', auth('driver'), async (req, res) => {
  try {
    let { rows } = await pool.query(
      'SELECT * FROM safety_settings WHERE driver_id = $1',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      // Create default settings if none exist
      const { rows: newSettings } = await pool.query(
        `INSERT INTO safety_settings (driver_id, auto_share_location, emergency_alerts, ride_sharing, background_tracking, voice_commands, panic_button_enabled) 
         VALUES ($1, true, true, true, true, true, true) RETURNING *`,
        [req.user.id]
      );
      rows = newSettings;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching safety settings:', error);
    res.status(500).json({ error: 'Failed to fetch safety settings' });
  }
});

router.put('/safety-settings', auth('driver'), async (req, res) => {
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
      [req.user.id, auto_share_location, emergency_alerts, ride_sharing, background_tracking, voice_commands, panic_button_enabled, auto_sos, night_mode, silent_mode]
    );
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating safety settings:', error);
    res.status(500).json({ error: 'Failed to update safety settings' });
  }
});

// Incident Reports Routes
router.get('/incident-reports', auth('driver'), async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM incident_reports WHERE driver_id = $1 ORDER BY reported_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching incident reports:', error);
    res.status(500).json({ error: 'Failed to fetch incident reports' });
  }
});

router.post('/incident-reports', auth('driver'), async (req, res) => {
  try {
    const { type, description, severity, location_latitude, location_longitude, ride_id } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO incident_reports (driver_id, ride_id, type, description, severity, location_latitude, location_longitude) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, ride_id, type, description, severity, location_latitude, location_longitude]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, message_content) 
       VALUES ($1, $2, 'incident_report', 'admin', $3)`,
      [req.user.id, ride_id, `Incident reported: ${type} - ${description}`]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error creating incident report:', error);
    res.status(500).json({ error: 'Failed to create incident report' });
  }
});

// Emergency Alerts Routes
router.post('/emergency-alerts', auth('driver'), async (req, res) => {
  try {
    const { alert_type, location_latitude, location_longitude, ride_id, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO emergency_alerts (driver_id, ride_id, alert_type, location_latitude, location_longitude, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, ride_id, alert_type, location_latitude, location_longitude, notes]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, message_content) 
       VALUES ($1, $2, 'emergency_alert', 'emergency_services', $3)`,
      [req.user.id, ride_id, `Emergency alert triggered: ${alert_type}`]
    );
    
    // Emit socket event for real-time updates
    const io = req.app.get('io');
    io.emit('emergency:alert', {
      driverId: req.user.id,
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

router.put('/emergency-alerts/:id/respond', auth('driver'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      'UPDATE emergency_alerts SET status = $1, responded_at = NOW() WHERE id = $2 AND driver_id = $3 RETURNING *',
      ['responded', id, req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating emergency alert:', error);
    res.status(500).json({ error: 'Failed to update emergency alert' });
  }
});

// Location Sharing Routes
router.post('/share-location', auth('driver'), async (req, res) => {
  try {
    const { latitude, longitude, accuracy, speed, heading, altitude, ride_id, shared_with } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO location_sharing (driver_id, ride_id, latitude, longitude, accuracy, speed, heading, altitude, shared_with) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.user.id, ride_id, latitude, longitude, accuracy, speed, heading, altitude, shared_with]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, recipient_details, message_content) 
       VALUES ($1, $2, 'location_shared', 'contacts', $3, 'Location shared with emergency contacts')`,
      [req.user.id, ride_id, shared_with]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error sharing location:', error);
    res.status(500).json({ error: 'Failed to share location' });
  }
});

// Trip Sharing Routes
router.post('/share-trip', auth('driver'), async (req, res) => {
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
      [req.user.id, ride_id, pickup_address, destination_address, estimated_arrival, current_location_latitude, current_location_longitude, shared_with]
    );
    
    // Log communication
    await pool.query(
      `INSERT INTO communication_history (driver_id, ride_id, communication_type, recipient_type, recipient_details, message_content) 
       VALUES ($1, $2, 'trip_update', 'contacts', $3, 'Trip status shared with emergency contacts')`,
      [req.user.id, ride_id, shared_with]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error sharing trip:', error);
    res.status(500).json({ error: 'Failed to share trip' });
  }
});

// Voice Commands Log Routes
router.post('/voice-commands', auth('driver'), async (req, res) => {
  try {
    const { command_text, recognized_command, confidence_score, ride_id, executed, execution_result } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO voice_commands_log (driver_id, ride_id, command_text, recognized_command, confidence_score, executed, execution_result) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, ride_id, command_text, recognized_command, confidence_score, executed, execution_result]
    );
    
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Error logging voice command:', error);
    res.status(500).json({ error: 'Failed to log voice command' });
  }
});

// Communication History Routes
router.get('/communication-history', auth('driver'), async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;
    const { rows } = await pool.query(
      'SELECT * FROM communication_history WHERE driver_id = $1 ORDER BY sent_at DESC LIMIT $2 OFFSET $3',
      [req.user.id, limit, offset]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching communication history:', error);
    res.status(500).json({ error: 'Failed to fetch communication history' });
  }
});

// Safety Metrics Routes
router.get('/safety-metrics', auth('driver'), async (req, res) => {
  try {
    let { rows } = await pool.query(
      'SELECT * FROM safety_metrics WHERE driver_id = $1',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      // Create default metrics if none exist
      const { rows: newMetrics } = await pool.query(
        'INSERT INTO safety_metrics (driver_id, total_rides, safe_rides, incidents, average_response_time_seconds, safety_score) VALUES ($1, 0, 0, 0, 0.0, 100) RETURNING *',
        [req.user.id]
      );
      rows = newMetrics;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching safety metrics:', error);
    res.status(500).json({ error: 'Failed to fetch safety metrics' });
  }
});

// Driver Verification Routes
router.get('/verification-status', auth('driver'), async (req, res) => {
  try {
    let { rows } = await pool.query(
      'SELECT * FROM driver_verification WHERE driver_id = $1',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      // Create default verification status if none exist
      const { rows: newVerification } = await pool.query(
        'INSERT INTO driver_verification (driver_id, photo_verified, license_verified, insurance_verified, background_check_verified, vehicle_inspection_verified, verification_score) VALUES ($1, false, false, false, false, false, 0) RETURNING *',
        [req.user.id]
      );
      rows = newVerification;
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching verification status:', error);
    res.status(500).json({ error: 'Failed to fetch verification status' });
  }
});

router.put('/verification-status', auth('driver'), async (req, res) => {
  try {
    const {
      photo_verified,
      license_verified,
      insurance_verified,
      background_check_verified,
      vehicle_inspection_verified
    } = req.body;

    // Calculate verification score
    const verificationScore = [
      photo_verified,
      license_verified,
      insurance_verified,
      background_check_verified,
      vehicle_inspection_verified
    ].filter(Boolean).length * 20; // 20 points per verified item

    const { rows } = await pool.query(
      `INSERT INTO driver_verification (driver_id, photo_verified, license_verified, insurance_verified, background_check_verified, vehicle_inspection_verified, verification_score, last_verified_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (driver_id) 
       DO UPDATE SET 
         photo_verified = EXCLUDED.photo_verified,
         license_verified = EXCLUDED.license_verified,
         insurance_verified = EXCLUDED.insurance_verified,
         background_check_verified = EXCLUDED.background_check_verified,
         vehicle_inspection_verified = EXCLUDED.vehicle_inspection_verified,
         verification_score = EXCLUDED.verification_score,
         last_verified_at = NOW(),
         updated_at = NOW()
       RETURNING *`,
      [req.user.id, photo_verified, license_verified, insurance_verified, background_check_verified, vehicle_inspection_verified, verificationScore]
    );
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating verification status:', error);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

/**
 * @swagger
 * /api/safety/emergency:
 *   post:
 *     summary: Report emergency alert
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverId:
 *                 type: integer
 *               alertType:
 *                 type: string
 *               location:
 *                 type: object
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Emergency alert recorded
 */
router.post('/emergency', auth('driver'), async (req, res) => {
  try {
    const { driverId, alertType, location, notes } = req.body;
    
    // Validate required fields
    if (!driverId || !alertType || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Record emergency alert
    const result = await pool.query(
      'INSERT INTO safety_alerts (driver_id, alert_type, location, notes, timestamp) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [driverId, alertType, JSON.stringify(location), notes]
    );
    
    // Broadcast to all connected clients via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').emit('emergency:alert', {
        driverId,
        alertType,
        location,
        notes,
        timestamp: new Date().toISOString()
      });
    }
    
    res.json({ 
      message: 'Emergency alert recorded',
      alert: result.rows[0]
    });
  } catch (error) {
    console.error('Emergency alert error:', error);
    res.status(500).json({ error: 'Failed to record emergency alert' });
  }
});

/**
 * @swagger
 * /api/safety/alerts:
 *   get:
 *     summary: Get safety alerts
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of safety alerts
 */
router.get('/alerts', auth(), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM safety_alerts ORDER BY timestamp DESC LIMIT 50'
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ error: 'Failed to get safety alerts' });
  }
});

/**
 * @swagger
 * /api/safety/check-in:
 *   post:
 *     summary: Driver safety check-in
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               driverId:
 *                 type: integer
 *               location:
 *                 type: object
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Check-in recorded
 */
router.post('/check-in', auth('driver'), async (req, res) => {
  try {
    const { driverId, location, status } = req.body;
    
    // Record safety check-in
    const result = await pool.query(
      'INSERT INTO safety_checkins (driver_id, location, status, timestamp) VALUES ($1, $2, $3, NOW()) RETURNING *',
      [driverId, JSON.stringify(location), status]
    );
    
    res.json({ 
      message: 'Safety check-in recorded',
      checkin: result.rows[0]
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

module.exports = router; 