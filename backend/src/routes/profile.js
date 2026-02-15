const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// Get user's profile
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json({});
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Create or update profile
router.post('/', authMiddleware, async (req, res) => {
  const { city, state, high_school, college, yeshiva_seminary, about_me, location_radius } = req.body;

  try {
    const existingProfile = await pool.query(
      'SELECT id FROM profiles WHERE user_id = $1',
      [req.userId]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      result = await pool.query(
        `UPDATE profiles
         SET city = $1, state = $2, high_school = $3, college = $4, yeshiva_seminary = $5, about_me = $6, updated_at = NOW()
         WHERE user_id = $7
         RETURNING *`,
        [city, state, high_school, college, yeshiva_seminary, about_me, req.userId]
      );
    } else {
      result = await pool.query(
        `INSERT INTO profiles (user_id, city, state, high_school, college, yeshiva_seminary, about_me)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.userId, city, state, high_school, college, yeshiva_seminary, about_me]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get public profile by user ID (only if matched)
router.get('/:userId', authMiddleware, async (req, res) => {
  const { userId } = req.params;

  try {
    // Check if users are matched
    const matchResult = await pool.query(
      `SELECT id FROM matches
       WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
       AND status = 'active'`,
      [req.userId, userId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(403).json({ error: 'Not authorized to view this profile' });
    }

    const profileResult = await pool.query(
      `SELECT u.full_name, p.city, p.state, p.high_school, p.college, p.yeshiva_seminary, p.about_me
       FROM profiles p
       JOIN users u ON p.user_id = u.id
       WHERE p.user_id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.json({});
    }

    res.json(profileResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

module.exports = router;
