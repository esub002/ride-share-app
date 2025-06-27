/**
 * authUser.js - User authentication, registration, verification, and password reset
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const { logEvent } = require('../utils/log');
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
 * /api/auth/user/register:
 *   post:
 *     summary: Register a new user
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
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User registered
 */
// Register user
router.post('/register', authLimiter, [
  body('name').isLength({ min: 2, max: 100 }).trim().escape(),
  body('email').isEmail().normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .matches(/[A-Z]/).withMessage('must contain an uppercase letter')
    .matches(/[0-9]/).withMessage('must contain a number')
    .matches(/[^A-Za-z0-9]/).withMessage('must contain a special character'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { name, email, password } = req.body;
  
  try {
    // Get pool from app.locals or require it directly
    const pool = req.app.locals.pool || require('../db');
    
    // Prevent duplicate registration
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists && exists.rows && exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    // Generate verification token and expiry (1 hour)
    const verification_token = crypto.randomBytes(32).toString('hex');
    const verification_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const result = await pool.query(
      'INSERT INTO users (name, email, password, verification_token, verification_token_expires) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, verification_token',
      [name, email, hash, verification_token, verification_token_expires]
    );
    
    // Send verification email with link
    const verifyUrl = `http://localhost:3000/api/auth/user/verify?token=${verification_token}`;
    await sendEmail({
      to: email,
      subject: 'Verify your RideShare account',
      text: `Welcome to RideShare, ${name}! Please verify your account: ${verifyUrl}`,
      html: `<div style='font-family:sans-serif'><h1>Welcome, ${name}!</h1><p>Please <a href="${verifyUrl}">verify your RideShare account</a>.<br>This link will expire in 1 hour.</p></div>`
    });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ error: err.message });
  }
});

/**
 * @swagger
 * /api/auth/user/login:
 *   post:
 *     summary: Login as user
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
 *         description: User logged in
 */
// Login user
router.post('/login', [
  body('email').isEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { email, password } = req.body;
  
  try {
    // Get pool from app.locals or require it directly
    const pool = req.app.locals.pool || require('../db');
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result || !result.rows || !result.rows[0]) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    if (!user.verified) return res.status(403).json({ error: 'Email not verified' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Email verification route
router.get('/verify', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'No token provided' });
  const result = await pool.query('UPDATE users SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE verification_token = $1 AND verification_token_expires > NOW() RETURNING id, email, verified', [token]);
  if (result.rowCount === 0) return res.status(400).json({ error: 'Invalid or expired token' });
  logEvent('user_verification_successful', { email: result.rows[0].email });
  res.json({ message: 'Email verified successfully', user: result.rows[0] });
});

// Resend verification email
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.verified) return res.status(400).json({ error: 'User already verified' });
  // Generate new token and expiry
  const verification_token = crypto.randomBytes(32).toString('hex');
  const verification_token_expires = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query('UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3', [verification_token, verification_token_expires, user.id]);
  const verifyUrl = `http://localhost:3000/api/auth/user/verify?token=${verification_token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your RideShare account',
    text: `Please verify your account: ${verifyUrl}`,
    html: `<div style='font-family:sans-serif'><h1>Verify your RideShare account</h1><p>Please <a href="${verifyUrl}">verify your account</a>.<br>This link will expire in 1 hour.</p></div>`
  });
  logEvent('user_verification_requested', { email });
  res.json({ message: 'Verification email resent' });
});

/**
 * @swagger
 * /api/auth/user/request-reset:
 *   post:
 *     summary: Request password reset for user
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
// Request password reset
router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const reset_token = crypto.randomBytes(32).toString('hex');
  const reset_token_expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await pool.query('UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3', [reset_token, reset_token_expires, user.id]);
  const resetUrl = `http://localhost:3000/api/auth/user/reset-password?token=${reset_token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your RideShare password',
    text: `Reset your password: ${resetUrl}`,
    html: `<div style='font-family:sans-serif'><h1>Reset your RideShare password</h1><p><a href="${resetUrl}">Reset Password</a> (expires in 1 hour)</p></div>`
  });
  logEvent('user_password_reset_requested', { email });
  res.json({ message: 'Password reset email sent' });
});

// Reset password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password too short' });
  const userRes = await pool.query('SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()', [token]);
  const user = userRes.rows[0];
  if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2', [hash, user.id]);
  res.json({ message: 'Password reset successful' });
});

module.exports = router;
