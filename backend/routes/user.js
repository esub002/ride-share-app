// user.js - User CRUD and related endpoints

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db');
const crypto = require('crypto');
const sendEmail = require('../utils/email');
const router = express.Router();

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: List of users
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *     responses:
 *       200:
 *         description: User created
 */

// Create user
router.post(
  '/',
  [
    body('name').isLength({ min: 2 }),
    body('email').isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
        [name, email]
      );
      res.json(result.rows[0]);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
);

// Get all users
router.get('/', async (req, res) => {
  const { page = 1, limit = 10, name } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM users';
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

// Get user by id
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  res.json(result.rows[0]);
});

// Update user
router.put(
  '/:id',
  [
    body('name').isLength({ min: 2 }),
    body('email').isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { name, email } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, req.params.id]
    );
    res.json(result.rows[0]);
  }
);

// Update user email (requires re-verification)
router.put('/:id/email', async (req, res) => {
  const { email } = req.body;
  const { id } = req.params;
  // Check if email is already in use
  const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
  if (exists.rows.length > 0) return res.status(409).json({ error: 'Email already in use' });
  // Generate new verification token and expiry
  const verification_token = crypto.randomBytes(32).toString('hex');
  const verification_token_expires = new Date(Date.now() + 60 * 60 * 1000);
  await pool.query('UPDATE users SET email = $1, verified = FALSE, verification_token = $2, verification_token_expires = $3 WHERE id = $4', [email, verification_token, verification_token_expires, id]);
  const verifyUrl = `http://localhost:3000/api/auth/user/verify?token=${verification_token}`;
  await sendEmail({
    to: email,
    subject: 'Verify your new RideShare email',
    text: `Please verify your new email: ${verifyUrl}`,
    html: `<div style='font-family:sans-serif'><h1>Verify your new RideShare email</h1><p><a href="${verifyUrl}">Verify Email</a> (expires in 1 hour)</p></div>`
  });
  res.json({ message: 'Email updated. Please verify your new email address.' });
});

// Delete user
router.delete('/:id', async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

module.exports = router;
