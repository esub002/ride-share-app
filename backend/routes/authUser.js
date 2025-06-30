/**
 * authUser.js - User authentication, registration, verification, and password reset
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { logEvent } = require('../utils/log');
const { validateRequest, commonValidations } = require('../middleware/security');
const { secureQuery, transaction, auditLog } = require('../middleware/database');
const { generateToken } = require('../middleware/auth');
const sendEmail = require('../utils/email');
const router = express.Router();

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
router.post('/register', 
  validateRequest([
    commonValidations.name,
    commonValidations.email,
    commonValidations.password
  ]),
  auditLog('user_registration', 'users'),
  async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
      // Check if user already exists
      const existingUser = await secureQuery(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Email already registered',
          code: 'EMAIL_EXISTS'
        });
      }
      
      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Generate verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Create user
      const result = await secureQuery(
        `INSERT INTO users (name, email, password, verification_token, verification_token_expires) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id, name, email, verification_token`,
        [name, email, hashedPassword, verificationToken, verificationTokenExpires]
      );
      
      const user = result.rows[0];
      
      // Send verification email
      const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify?token=${verificationToken}`;
      await sendEmail({
        to: email,
        subject: 'Verify your RideShare account',
        text: `Welcome to RideShare, ${name}! Please verify your account: ${verifyUrl}`,
        html: `
          <div style='font-family:sans-serif'>
            <h1>Welcome, ${name}!</h1>
            <p>Please <a href="${verifyUrl}">verify your RideShare account</a>.</p>
            <p>This link will expire in 1 hour.</p>
          </div>
        `
      });
      
      logEvent('user_registered', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });
      
      res.status(201).json({
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        }
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      logEvent('registration_error', {
        error: error.message,
        email,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({ 
        error: 'Registration failed. Please try again.',
        code: 'REGISTRATION_FAILED'
      });
    }
  }
);

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
router.post('/login',
  validateRequest([
    commonValidations.email,
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ]),
  auditLog('user_login', 'users'),
  async (req, res) => {
    const { email, password } = req.body;
    
    try {
      // Find user
      const result = await secureQuery(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      const user = result.rows[0];
      
      // Check if email is verified
      if (!user.verified) {
        return res.status(403).json({ 
          error: 'Email not verified. Please check your email and verify your account.',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }
      
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        logEvent('login_failed', {
          email,
          reason: 'invalid_password',
          timestamp: new Date().toISOString()
        });
        
        return res.status(401).json({ 
          error: 'Invalid credentials',
          code: 'INVALID_CREDENTIALS'
        });
      }
      
      // Generate tokens
      const accessToken = generateToken({
        userId: user.id,
        role: 'user',
        permissions: ['read:own', 'write:own']
      }, 'access');
      
      const refreshToken = generateToken({
        userId: user.id,
        role: 'user',
        permissions: ['read:own', 'write:own']
      }, 'refresh');
      
      // Update last login
      await secureQuery(
        'UPDATE users SET last_login = NOW() WHERE id = $1',
        [user.id]
      );
      
      logEvent('user_login_success', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });
      
      res.json({
        message: 'Login successful',
        accessToken,
        refreshToken,
        expiresIn: 15 * 60, // 15 minutes
        refreshExpiresIn: 7 * 24 * 60 * 60, // 7 days
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: 'user'
        }
      });
      
    } catch (error) {
      console.error('Login error:', error);
      logEvent('login_error', {
        error: error.message,
        email,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({ 
        error: 'Login failed. Please try again.',
        code: 'LOGIN_FAILED'
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/user/verify:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified
 */
// Email verification route
router.get('/verify', async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    return res.status(400).json({ 
      error: 'Verification token required',
      code: 'MISSING_TOKEN'
    });
  }
  
  try {
    const result = await secureQuery(
      `UPDATE users 
       SET verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
       WHERE verification_token = $1 AND verification_token_expires > NOW() 
       RETURNING id, email, verified`,
      [token]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token',
        code: 'INVALID_TOKEN'
      });
    }
    
    const user = result.rows[0];
    
    logEvent('user_verification_successful', {
      userId: user.id,
      email: user.email,
      timestamp: new Date().toISOString()
    });
    
    res.json({ 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        verified: user.verified
      }
    });
    
  } catch (error) {
    console.error('Verification error:', error);
    logEvent('verification_error', {
      error: error.message,
      token: token.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Verification failed',
      code: 'VERIFICATION_FAILED'
    });
  }
});

/**
 * @swagger
 * /api/auth/user/forgot-password:
 *   post:
 *     summary: Request password reset
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
// Forgot password
router.post('/forgot-password',
  validateRequest([commonValidations.email]),
  async (req, res) => {
    const { email } = req.body;
    
    try {
      // Check if user exists
      const result = await secureQuery(
        'SELECT id, name FROM users WHERE email = $1 AND verified = TRUE',
        [email]
      );
      
      if (result.rows.length === 0) {
        // Don't reveal if email exists or not
        return res.json({ 
          message: 'If the email exists, a password reset link has been sent.'
        });
      }
      
      const user = result.rows[0];
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Store reset token
      await secureQuery(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [resetToken, resetTokenExpires, user.id]
      );
      
      // Send reset email
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      await sendEmail({
        to: email,
        subject: 'Reset your RideShare password',
        text: `Hello ${user.name}, please reset your password: ${resetUrl}`,
        html: `
          <div style='font-family:sans-serif'>
            <h1>Password Reset</h1>
            <p>Hello ${user.name},</p>
            <p>Please <a href="${resetUrl}">reset your password</a>.</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
          </div>
        `
      });
      
      logEvent('password_reset_requested', {
        userId: user.id,
        email,
        timestamp: new Date().toISOString()
      });
      
      res.json({ 
        message: 'If the email exists, a password reset link has been sent.'
      });
      
    } catch (error) {
      console.error('Forgot password error:', error);
      logEvent('forgot_password_error', {
        error: error.message,
        email,
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({ 
        error: 'Failed to process password reset request',
        code: 'RESET_REQUEST_FAILED'
      });
    }
  }
);

/**
 * @swagger
 * /api/auth/user/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 */
// Reset password
router.post('/reset-password',
  validateRequest([
    body('token').isLength({ min: 1 }).withMessage('Reset token required'),
    commonValidations.password
  ]),
  async (req, res) => {
    const { token, password } = req.body;
    
    try {
      // Find user with valid reset token
      const result = await secureQuery(
        'SELECT id, email FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
        [token]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ 
          error: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }
      
      const user = result.rows[0];
      
      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // Update password and clear reset token
      await secureQuery(
        'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
        [hashedPassword, user.id]
      );
      
      logEvent('password_reset_successful', {
        userId: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });
      
      res.json({ 
        message: 'Password reset successful. You can now login with your new password.'
      });
      
    } catch (error) {
      console.error('Reset password error:', error);
      logEvent('reset_password_error', {
        error: error.message,
        token: token.substring(0, 10) + '...',
        timestamp: new Date().toISOString()
      });
      
      res.status(500).json({ 
        error: 'Password reset failed',
        code: 'RESET_FAILED'
      });
    }
  }
);

module.exports = router;
