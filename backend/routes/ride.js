// ride.js - Ride CRUD and related endpoints
const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const router = express.Router();
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * /api/rides:
 *   get:
 *     summary: Get all rides
 *     tags: [Rides]
 *     responses:
 *       200:
 *         description: List of rides
 *   post:
 *     summary: Create a new ride
 *     tags: [Rides]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rider_id:
 *                 type: integer
 *               driver_id:
 *                 type: integer
 *               origin:
 *                 type: string
 *               destination:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ride created
 */

// Create ride
router.post(
  '/',
  [
    body('rider_id').isInt().custom(async (value) => {
      const res = await pool.query('SELECT 1 FROM users WHERE id = $1', [value]);
      if (res.rows.length === 0) throw new Error('Invalid rider_id');
      return true;
    }),
    body('driver_id').optional().isInt().custom(async (value) => {
      if (value) {
        const res = await pool.query('SELECT 1 FROM drivers WHERE id = $1', [value]);
        if (res.rows.length === 0) throw new Error('Invalid driver_id');
      }
      return true;
    }),
    body('origin').isString().notEmpty().isLength({ max: 255 }).trim().escape(),
    body('destination').isString().notEmpty().isLength({ max: 255 }).trim().escape(),
    body('status').isString().notEmpty().isLength({ max: 50 }).trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { rider_id, driver_id, origin, destination, status } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO rides (rider_id, driver_id, origin, destination, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [rider_id, driver_id, origin, destination, status]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get all rides
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM rides';
  let params = [];
  if (status) {
    query += ' WHERE status = $1';
    params.push(status);
  }
  query += ' ORDER BY id LIMIT $2 OFFSET $3';
  params.push(limit, offset);
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Get ride by id
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});

// Update ride
router.put(
  '/:id',
  [
    body('rider_id').isInt().custom(async (value) => {
      const res = await pool.query('SELECT 1 FROM users WHERE id = $1', [value]);
      if (res.rows.length === 0) throw new Error('Invalid rider_id');
      return true;
    }),
    body('driver_id').optional().isInt().custom(async (value) => {
      if (value) {
        const res = await pool.query('SELECT 1 FROM drivers WHERE id = $1', [value]);
        if (res.rows.length === 0) throw new Error('Invalid driver_id');
      }
      return true;
    }),
    body('origin').isString().notEmpty().isLength({ max: 255 }).trim().escape(),
    body('destination').isString().notEmpty().isLength({ max: 255 }).trim().escape(),
    body('status').isString().notEmpty().isLength({ max: 50 }).trim().escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { rider_id, driver_id, origin, destination, status } = req.body;
    const result = await pool.query(
      'UPDATE rides SET rider_id = $1, driver_id = $2, origin = $3, destination = $4, status = $5 WHERE id = $6 RETURNING *',
      [rider_id, driver_id, origin, destination, status, req.params.id]
    );
    res.json(result.rows[0]);
  }
);

// Delete ride
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM rides WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// POST /api/rides - Create a new ride and assign nearest available driver
router.post('/', auth('user'), async (req, res) => {
  const { origin, destination } = req.body;
  const rider_id = req.user.userId;
  // Find nearest available driver (simple: first available with location)
  const driverRes = await pool.query(
    'SELECT id, latitude, longitude FROM drivers WHERE available = TRUE AND verified = TRUE AND latitude IS NOT NULL AND longitude IS NOT NULL ORDER BY id LIMIT 1'
  );
  if (driverRes.rows.length === 0) {
    return res.status(404).json({ error: 'No available drivers' });
  }
  const driver = driverRes.rows[0];
  const rideRes = await pool.query(
    'INSERT INTO rides (rider_id, driver_id, origin, destination, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [rider_id, driver.id, origin, destination, 'requested']
  );
  // Mark driver unavailable
  await pool.query('UPDATE drivers SET available = FALSE WHERE id = $1', [driver.id]);
  // Emit Socket.IO event (handled in server.js)
  req.app.get('io').emit('ride:requested', { ride: rideRes.rows[0], driver });
  res.json(rideRes.rows[0]);
});

// PATCH /api/rides/:id/status - Update ride status
router.patch('/:id/status', auth(), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const validStatuses = ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const rideRes = await pool.query('UPDATE rides SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
  if (rideRes.rowCount === 0) return res.status(404).json({ error: 'Ride not found' });
  // Emit Socket.IO event
  req.app.get('io').emit('ride:status', { ride: rideRes.rows[0] });
  res.json(rideRes.rows[0]);
});

module.exports = router;
