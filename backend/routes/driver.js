// driver.js - Driver CRUD, location, and related endpoints
const auth = require('../middleware/auth');
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

module.exports = router;
