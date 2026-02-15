const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/email');

const router = express.Router();

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, full_name, date_of_birth, terms_accepted } = req.body;

  try {
    // Validation
    if (!email || !password || !full_name || !date_of_birth) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check age (18+)
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (age < 18 || (age === 18 && monthDiff < 0)) {
      return res.status(400).json({ error: 'Must be 18 or older' });
    }

    if (!terms_accepted) {
      return res.status(400).json({ error: 'Must accept terms and conditions' });
    }

    // Check if user exists
    const userExists = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, date_of_birth, age_verified, terms_accepted)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name`,
      [email, hashedPassword, full_name, date_of_birth, true, true]
    );

    const user = result.rows[0];

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, purpose: 'email_verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    // Create moderation record
    await pool.query(
      'INSERT INTO profile_moderation (user_id, status) VALUES ($1, $2)',
      [user.id, 'pending']
    );

    res.status(201).json({
      message: 'User created. Please check your email to verify your account.',
      userId: user.id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// Verify email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== 'email_verification') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await pool.query(
      'UPDATE users SET email_verified = true, verified_at = NOW() WHERE id = $1',
      [decoded.userId]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(400).json({ error: 'Token invalid or expired' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const result = await pool.query(
      'SELECT id, password_hash, email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if email verified (warning in dev, skip in production)
    if (!user.email_verified && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Email not verified' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, userId: user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, full_name FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
