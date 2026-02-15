const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// Get user profile status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.full_name, m.status as moderation_status
       FROM users u
       LEFT JOIN profile_moderation m ON u.id = m.user_id
       WHERE u.id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user status' });
  }
});

module.exports = router;
