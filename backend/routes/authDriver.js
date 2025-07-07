// authDriver.js - Driver authentication with mobile OTP (fake OTP for testing)

const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');
// const sendEmail = require('../utils/email'); // Commented out email functionality
const router = express.Router();

// Initialize Google OAuth2 client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

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
  body('phone').isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10-15 digits'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { phone } = req.body;
  
  try {
    // Always use fixed test OTP for development
    const testOtp = "123456";
    
    // Store OTP with expiry (5 minutes)
    otpStore.set(phone, {
      otp: testOtp,
      expires: Date.now() + 5 * 60 * 1000 // 5 minutes
    });
    
    console.log(`Test OTP sent to ${phone}: ${testOtp}`);
    
    res.json({ 
      message: 'OTP sent successfully',
      otp: testOtp // Always return 123456 for testing
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Verify OTP and login/register driver
router.post('/verify-otp', [
  body('phone').isLength({ min: 10, max: 15 }).withMessage('Phone number must be between 10-15 digits'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('name').optional().isLength({ min: 2, max: 100 }).trim().escape(),
  body('car_info').optional().isString().isLength({ max: 100 }).trim().escape(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { phone, otp, name, car_info } = req.body;
  
  try {
    // Check if OTP is the test OTP or stored OTP
    const storedOTP = otpStore.get(phone);
    const isValidOTP = (otp === "123456") || (storedOTP && storedOTP.otp === otp && Date.now() <= storedOTP.expires);
    
    if (!isValidOTP) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Clear the OTP after successful verification
    otpStore.delete(phone);
    
    // For testing, create a mock driver response without database
    const mockDriver = {
      id: 'test-driver-' + Date.now(),
      name: name || 'Test Driver',
      phone: phone,
      car_info: car_info || 'Test Car'
    };
    
    console.log(`Driver logged in: ${mockDriver.name} (${phone})`);
    
    // Generate JWT token
    const token = jwt.sign({ 
      driverId: mockDriver.id, 
      role: 'driver',
      phone: mockDriver.phone 
    }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ 
      token,
      driver: {
        id: mockDriver.id,
        name: mockDriver.name,
        phone: mockDriver.phone,
        car_info: mockDriver.car_info
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

// Google Sign-In endpoints
/**
 * @swagger
 * /api/auth/driver/google-signin:
 *   post:
 *     summary: Sign in existing driver with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               email:
 *                 type: string
 *               displayName:
 *                 type: string
 *               photoURL:
 *                 type: string
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Driver signed in successfully
 *       404:
 *         description: Driver not found
 */

/**
 * @swagger
 * /api/auth/driver/google-signup:
 *   post:
 *     summary: Register new driver with Google
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firebaseUid:
 *                 type: string
 *               email:
 *                 type: string
 *               displayName:
 *                 type: string
 *               photoURL:
 *                 type: string
 *               idToken:
 *                 type: string
 *               driverProfile:
 *                 type: object
 *     responses:
 *       200:
 *         description: Driver registered successfully
 *       409:
 *         description: Driver already exists
 */

// Check if driver exists by email
router.get('/check-email', async (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'Email parameter is required' });
  }
  
  try {
    // For now, use mock data - in production, check database
    const mockDrivers = [
      { email: 'test@example.com', exists: true },
      { email: 'driver@example.com', exists: true }
    ];
    
    const driver = mockDrivers.find(d => d.email === email);
    const exists = driver ? driver.exists : false;
    
    console.log(`Checking email existence: ${email} - ${exists ? 'EXISTS' : 'NOT FOUND'}`);
    
    res.json({ 
      success: true,
      data: { exists }
    });
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ error: 'Failed to check email' });
  }
});

// Google Sign-In for existing users
router.post('/google-signin', [
  body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('displayName').optional().isString(),
  body('photoURL').optional().isURL(),
  body('idToken').notEmpty().withMessage('ID token is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { firebaseUid, email, displayName, photoURL, idToken, googleUser } = req.body;
  
  try {
    // Verify Google ID token (in production, use google-auth-library)
    // For now, we'll trust the token from the client
    
    // Check if driver exists in database
    // For testing, use mock data
    const mockDriver = {
      id: 'google-driver-' + Date.now(),
      firebaseUid: firebaseUid,
      email: email,
      name: displayName || googleUser?.name || 'Google Driver',
      photoURL: photoURL || googleUser?.photo,
      phone: null,
      car_info: null,
      isActive: true,
      registrationDate: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    console.log(`Google Sign-In successful: ${mockDriver.name} (${email})`);
    
    // Generate JWT token
    const token = jwt.sign({ 
      driverId: mockDriver.id, 
      role: 'driver',
      email: mockDriver.email,
      firebaseUid: mockDriver.firebaseUid
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true,
      token,
      user: {
        id: mockDriver.id,
        firebaseUid: mockDriver.firebaseUid,
        email: mockDriver.email,
        name: mockDriver.name,
        photoURL: mockDriver.photoURL,
        phone: mockDriver.phone,
        car_info: mockDriver.car_info,
        isActive: mockDriver.isActive,
        registrationDate: mockDriver.registrationDate,
        lastLogin: mockDriver.lastLogin
      }
    });
    
  } catch (err) {
    console.error('Error in Google Sign-In:', err);
    res.status(500).json({ error: 'Failed to sign in with Google' });
  }
});

// Google Sign-Up for new users
router.post('/google-signup', [
  body('firebaseUid').notEmpty().withMessage('Firebase UID is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('displayName').optional().isString(),
  body('photoURL').optional().isURL(),
  body('idToken').notEmpty().withMessage('ID token is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  const { firebaseUid, email, displayName, photoURL, idToken, googleUser, driverProfile } = req.body;
  
  try {
    // Verify Google ID token (in production, use google-auth-library)
    // For now, we'll trust the token from the client
    
    // Check if driver already exists
    // For testing, use mock data
    const existingDrivers = [
      { email: 'test@example.com' },
      { email: 'driver@example.com' }
    ];
    
    const exists = existingDrivers.some(d => d.email === email);
    if (exists) {
      return res.status(409).json({ 
        success: false,
        error: 'Driver with this email already exists' 
      });
    }
    
    // Create new driver
    const newDriver = {
      id: 'google-driver-' + Date.now(),
      firebaseUid: firebaseUid,
      email: email,
      name: displayName || googleUser?.name || 'New Google Driver',
      photoURL: photoURL || googleUser?.photo,
      phone: null,
      car_info: null,
      isActive: true,
      registrationDate: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      profileComplete: false,
      ...driverProfile
    };
    
    console.log(`Google Sign-Up successful: ${newDriver.name} (${email})`);
    
    // Generate JWT token
    const token = jwt.sign({ 
      driverId: newDriver.id, 
      role: 'driver',
      email: newDriver.email,
      firebaseUid: newDriver.firebaseUid
    }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({ 
      success: true,
      token,
      user: {
        id: newDriver.id,
        firebaseUid: newDriver.firebaseUid,
        email: newDriver.email,
        name: newDriver.name,
        photoURL: newDriver.photoURL,
        phone: newDriver.phone,
        car_info: newDriver.car_info,
        isActive: newDriver.isActive,
        registrationDate: newDriver.registrationDate,
        lastLogin: newDriver.lastLogin,
        profileComplete: newDriver.profileComplete
      }
    });
    
  } catch (err) {
    console.error('Error in Google Sign-Up:', err);
    res.status(500).json({ error: 'Failed to sign up with Google' });
  }
});

module.exports = router;
