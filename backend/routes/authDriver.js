// authDriver.js - Driver authentication, registration, verification, and password reset

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../db');
const rateLimit = require('express-rate-limit');
const sendEmail = require('../utils/email');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var in production

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

/**
 * @swagger
 * /api/auth/driver/register:
 *   post:
 *     summary: Register a new driver
 *     tags: [Auth]
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
 *         description: Driver registered
 */

/**
 * @swagger
 * /api/auth/driver/login:
 *   post:
 *     summary: Login as driver
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver logged in
 */

/**
 * @swagger
 * /api/auth/driver/request-reset:
 *   post:
 *     summary: Request password reset for driver
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 */

// Register driver
router.post('/register', [
  body('name').isLength({ min: 2, max: 100 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('car_info').optional().isString().isLength({ max: 100 }).trim().escape(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('must contain a special character'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { name, car_info, email, password } = req.body;
  // Prevent duplicate registration
  const exists = await pool.query('SELECT 1 FROM drivers WHERE email = $1', [email]);
  if (exists.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });
  try {
    const hash = await bcrypt.hash(password, 10);
    // Generate verification token and expiry (1 hour)
    const verification_token = crypto.randomBytes(32).toString('hex');
    const verification_token_expires = new Date(Date.now() + 60 * 60 * 1000);
    const result = await pool.query(
      'INSERT INTO drivers (name, car_info, email, password, verification_token, verification_token_expires) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, verification_token',
      [name, car_info, email, hash, verification_token, verification_token_expires]
    );
    // Send verification email with link
    const verifyUrl = `http://localhost:3000/api/auth/driver/verify?token=${verification_token}`;
    await sendEmail({
      to: email,
      subject: 'Verify your RideShare Driver account',
      text: `Welcome to RideShare, ${name}! Please verify your driver account: ${verifyUrl}`,
      html: `<div style='font-family:sans-serif'><h1>Welcome, ${name}!</h1><p>Please <a href="${verifyUrl}">verify your RideShare driver account</a>.<br>This link will expire in 1 hour.</p></div>`
    });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Email verification route
router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'No token provided' });
  const result = await pool.query('UPDATE drivers SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE verification_token = $1 AND verification_token_expires > NOW() RETURNING id, email, verified', [token]);
  if (result.rowCount === 0) return res.status(400).json({ error: 'Invalid or expired token' });
  res.json({ message: 'Driver email verified successfully', driver: result.rows[0] });
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  const driverRes = await pool.query('SELECT * FROM drivers WHERE email = $1', [email]);
  const driver = driverRes.rows[0];
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  if (driver.verified) return res.status(400).json({ error: 'Driver already verified' });
  // Generate new token and expiry
  const verification_token = crypto.randomBytes(32).toString('hex');
  const verification_token_expires = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query('UPDATE drivers SET verification_token = $1, verification_token_expires = $2 WHERE id = $3', [verification_token, verification_token_expires, driver.id]);
  const verifyUrl = `http://localhost:3000/api/auth/driver/verify?token=${verification_token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your RideShare Driver account',
    text: `Please verify your driver account: ${verifyUrl}`,
    html: `<div style='font-family:sans-serif'><h1>Verify your RideShare driver account</h1><p>Please <a href="${verifyUrl}">verify your account</a>.<br>This link will expire in 1 hour.</p></div>`
  });
  res.json({ message: 'Verification email resent' });
});

// Login driver
router.post('/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  const result = await pool.query('SELECT * FROM drivers WHERE email = $1', [email]);
  const driver = result.rows[0];
  if (!driver) return res.status(401).json({ error: 'Invalid credentials' });
  if (!driver.verified) return res.status(403).json({ error: 'Email not verified' });
  const valid = await bcrypt.compare(password, driver.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ driverId: driver.id, role: 'driver' }, JWT_SECRET, { expiresIn: '1d' });
  res.json({ token });
});

// Request password reset
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  const driverRes = await pool.query('SELECT * FROM drivers WHERE email = $1', [email]);
  const driver = driverRes.rows[0];
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  const reset_token = crypto.randomBytes(32).toString('hex');
  const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await pool.query('UPDATE drivers SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [reset_token, reset_token_expires, driver.id]);
  const resetUrl = `http://localhost:3000/api/auth/driver/reset-password?token=${reset_token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your RideShare Driver password',
    text: `Reset your password: ${resetUrl}`,
    html: `<div style='font-family:sans-serif'><h1>Reset your RideShare Driver password</h1><p><a href="${resetUrl}">Reset Password</a> (expires in 1 hour)</p></div>`
  });
  res.json({ message: 'Password reset email sent' });
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password too short' });
  const driverRes = await pool.query('SELECT * FROM drivers WHERE reset_token = $1 AND reset_token_expires > NOW()', [token]);
  const driver = driverRes.rows[0];
  if (!driver) return res.status(400).json({ error: 'Invalid or expired token' });
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE drivers SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [hash, driver.id]);
  res.json({ message: 'Password reset successful' });
});

module.exports = router;
