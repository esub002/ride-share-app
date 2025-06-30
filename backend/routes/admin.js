// admin.js - Admin endpoints for user, driver, ride management, logs, and analytics

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const router = express.Router();
const { auth } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of users
 * /api/admin/drivers:
 *   get:
 *     summary: Get all drivers (admin)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of drivers
 * /api/admin/rides:
 *   get:
 *     summary: Get all rides (admin)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: List of rides
 * /api/admin/analytics:
 *   get:
 *     summary: Get basic analytics (admin)
 *     tags: [Admin]
 *     responses:
 *       200:
 *         description: Analytics summary
 */

// Admin: Get all users
router.get('/users', auth('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});

// Admin: Verify user manually
router.post('/users/:id/verify', auth('admin'), async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE users SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1', [id]);
  res.json({ message: 'User verified by admin' });
});

// Admin: Deactivate user
router.post('/users/:id/deactivate', auth('admin'), async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE users SET verified = FALSE WHERE id = $1', [id]);
  res.json({ message: 'User deactivated by admin' });
});

// Admin: Get all drivers
router.get('/drivers', auth('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM drivers');
  res.json(result.rows);
});

// Admin: Verify driver manually
router.post('/drivers/:id/verify', auth('admin'), async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE drivers SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = $1', [id]);
  res.json({ message: 'Driver verified by admin' });
});

// Admin: Deactivate driver
router.post('/drivers/:id/deactivate', auth('admin'), async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE drivers SET verified = FALSE WHERE id = $1', [id]);
  res.json({ message: 'Driver deactivated by admin' });
});

// Admin: Get all rides
router.get('/rides', auth('admin'), async (req, res) => {
  const result = await pool.query('SELECT * FROM rides');
  res.json(result.rows);
});

// Admin: Update ride status
router.post('/rides/:id/status', auth('admin'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  await pool.query('UPDATE rides SET status = $1 WHERE id = $2', [status, id]);
  res.json({ message: 'Ride status updated by admin' });
});

// Admin: View logs
router.get('/logs', auth('admin'), (req, res) => {
  const logPath = path.join(__dirname, '../logs/events.log');
  if (!fs.existsSync(logPath)) return res.json({ logs: [] });
  const logs = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  res.json({ logs });
});

// Admin: Basic analytics
router.get('/analytics', auth('admin'), async (req, res) => {
  const users = await pool.query('SELECT COUNT(*) FROM users');
  const drivers = await pool.query('SELECT COUNT(*) FROM drivers');
  const rides = await pool.query('SELECT COUNT(*) FROM rides');
  res.json({
    total_users: parseInt(users.rows[0].count),
    total_drivers: parseInt(drivers.rows[0].count),
    total_rides: parseInt(rides.rows[0].count)
  });
});

// Admin: Advanced analytics
router.get('/analytics/summary', auth('admin'), async (req, res) => {
  const [users, drivers, rides] = await Promise.all([
    pool.query("SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'"),
    pool.query("SELECT COUNT(*) FROM drivers WHERE created_at >= NOW() - INTERVAL '30 days'"),
    pool.query("SELECT COUNT(*) FROM rides WHERE requested_at >= NOW() - INTERVAL '30 days'")
  ]);
  const rideStatus = await pool.query('SELECT status, COUNT(*) FROM rides GROUP BY status');
  const topDrivers = await pool.query('SELECT driver_id, COUNT(*) as rides FROM rides GROUP BY driver_id ORDER BY rides DESC LIMIT 5');
  res.json({
    new_users_30d: parseInt(users.rows[0].count),
    new_drivers_30d: parseInt(drivers.rows[0].count),
    new_rides_30d: parseInt(rides.rows[0].count),
    ride_status_breakdown: rideStatus.rows,
    top_drivers: topDrivers.rows
  });
});

// Admin: Filter users by date
router.get('/users/filter', auth('admin'), async (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM users WHERE 1=1';
  let params = [];
  if (from) { query += ' AND created_at >= $1'; params.push(from); }
  if (to) { query += params.length ? ' AND created_at <= $2' : ' AND created_at <= $1'; params.push(to); }
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Admin: Filter drivers by date
router.get('/drivers/filter', auth('admin'), async (req, res) => {
  const { from, to } = req.query;
  let query = 'SELECT * FROM drivers WHERE 1=1';
  let params = [];
  if (from) { query += ' AND created_at >= $1'; params.push(from); }
  if (to) { query += params.length ? ' AND created_at <= $2' : ' AND created_at <= $1'; params.push(to); }
  const result = await pool.query(query, params);
  res.json(result.rows);
});

// Admin: Filter rides by date and status
router.get('/rides/filter', auth('admin'), async (req, res) => {
  const { from, to, status } = req.query;
  let query = 'SELECT * FROM rides WHERE 1=1';
  let params = [];
  let idx = 1;
  if (from) { query += ` AND requested_at >= $${idx++}`; params.push(from); }
  if (to) { query += ` AND requested_at <= $${idx++}`; params.push(to); }
  if (status) { query += ` AND status = $${idx++}`; params.push(status); }
  const result = await pool.query(query, params);
  res.json(result.rows);
});

module.exports = router;
