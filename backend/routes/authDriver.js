// authDriver.js - Driver authentication with mobile OTP (fake OTP for testing)

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const rateLimit = require('express-rate-limit');
// const sendEmail = require('../utils/email'); // Commented out email functionality
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Use env var in production

// Rate limiting middleware
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many authentication attempts, please try again later.'
});

// In-memory storage for OTP (in production, use Redis or database)
const otpStore = new Map();

// Generate fake OTP (always returns 123456 for testing)
function generateFakeOTP() {
  return '123456';
}

/**
 * @swagger
 * /api/auth/driver/send-otp:
 *   post:
 *     summary: Send OTP to driver's mobile number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */

/**
 * @swagger
 * /api/auth/driver/verify-otp:
 *   post:
 *     summary: Verify OTP and login/register driver
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *               name:
 *                 type: string
 *               car_info:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver logged in/registered
 */

// Send OTP to mobile number
router.post('/send-otp', [
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { phone } = req.body;
  
  try {
    // Generate fake OTP
    const otp = generateFakeOTP();
    
    // Store OTP with expiry (5 minutes)
    otpStore.set(phone, {
      otp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    console.log(`Fake OTP sent to ${phone}: ${otp}`);
    
    res.json({ 
      message: 'OTP sent successfully',
      otp: otp // Only for testing - remove in production
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login/register driver
router.post('/verify-otp', [
  body('phone').isMobilePhone().withMessage('Invalid phone number'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('name').optional().isLength({ min: 2, max: 100 }).trim().escape(),
  body('car_info').optional().isString().isLength({ max: 100 }).trim().escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { phone, otp, name, car_info } = req.body;
  
  try {
    // Check if OTP exists and is valid
    const storedOTP = otpStore.get(phone);
    if (!storedOTP || storedOTP.otp !== otp || Date.now() > storedOTP.expires) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Clear the OTP after successful verification
    otpStore.delete(phone);
    
    // Check if driver exists
    let driver = await pool.query('SELECT * FROM drivers WHERE phone = $1', [phone]);
    
    if (driver.rows.length === 0) {
      // New driver - register
      if (!name || !car_info) {
        return res.status(400).json({ error: 'Name and car information required for new drivers' });
      }
      
      const result = await pool.query(
        'INSERT INTO drivers (name, phone, car_info, verified) VALUES ($1, $2, $3, $4) RETURNING id, name, phone, car_info',
        [name, phone, car_info, true]
      );
      
      driver = result.rows[0];
      console.log(`New driver registered: ${name} (${phone})`);
    } else {
      // Existing driver - login
      driver = driver.rows[0];
      console.log(`Driver logged in: ${driver.name} (${phone})`);
    }
    
    // Generate JWT token
    const token = jwt.sign({ 
      driverId: driver.id, 
      role: 'driver',
      phone: driver.phone 
    }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token,
      driver: {
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        car_info: driver.car_info
      }
    });
    
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// Commented out email-based authentication routes
/*
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
*/

module.exports = router;
