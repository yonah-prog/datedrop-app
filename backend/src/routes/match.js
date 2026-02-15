const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// Get user's active matches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.user1_id, m.user2_id, m.status, m.created_at, m.expires_at,
              u.full_name, p.city, p.state, p.about_me
       FROM matches m
       JOIN users u ON CASE WHEN m.user1_id = $1 THEN m.user2_id = u.id ELSE m.user1_id = u.id END
       JOIN profiles p ON u.id = p.user_id
       WHERE (m.user1_id = $1 OR m.user2_id = $1)
       AND m.status = 'active'
       ORDER BY m.created_at DESC`,
      [req.userId]
    );

    const matches = result.rows.map(row => ({
      id: row.id,
      userId: row.user1_id === req.userId ? row.user2_id : row.user1_id,
      fullName: row.full_name,
      city: row.city,
      state: row.state,
      aboutMe: row.about_me,
      status: row.status,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    }));

    res.json(matches);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get match history (past matches)
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.id, m.user1_id, m.user2_id, m.status, m.created_at,
              u.full_name, p.city, p.state
       FROM matches m
       JOIN users u ON CASE WHEN m.user1_id = $1 THEN m.user2_id = u.id ELSE m.user1_id = u.id END
       JOIN profiles p ON u.id = p.user_id
       WHERE (m.user1_id = $1 OR m.user2_id = $1)
       AND m.status != 'active'
       ORDER BY m.created_at DESC
       LIMIT 20`,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Respond to match (accept/deny)
router.post('/:matchId/respond', authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const { action } = req.body; // 'accept' or 'deny'

  try {
    if (!['accept', 'deny'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    // Get match info
    const matchResult = await pool.query(
      'SELECT id, user1_id, user2_id, status FROM matches WHERE id = $1',
      [matchId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Verify user is part of this match
    if (match.user1_id !== req.userId && match.user2_id !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (action === 'deny') {
      // Determine who denied
      const denyingUser = match.user1_id === req.userId ? 'user1' : 'user2';
      const newStatus = denyingUser === 'user1' ? 'denied_by_user1' : 'denied_by_user2';

      await pool.query('UPDATE matches SET status = $1 WHERE id = $2', [newStatus, matchId]);

      // Hide messages
      await hideMatchMessages(matchId);
    } else if (action === 'accept') {
      // Just mark as accepted (can be extended for future features)
      // For now, just update a hypothetical accepted_by field
      // Or implement after message response
    }

    res.json({ message: `Match ${action}ed successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to respond to match' });
  }
});

// Hide all messages for a match (called when denied)
async function hideMatchMessages(matchId) {
  try {
    await pool.query(
      `DELETE FROM messages WHERE match_id = $1`,
      [matchId]
    );
  } catch (err) {
    console.error('Failed to hide match messages:', err);
  }
}

// Get drop status and opt-in info
router.get('/drop/status', authMiddleware, async (req, res) => {
  try {
    // Get next drop event
    const nextDropResult = await pool.query(
      `SELECT id, event_date, status FROM weekly_drop_events
       WHERE event_date > NOW()
       ORDER BY event_date ASC
       LIMIT 1`
    );

    const nextDrop = nextDropResult.rows[0];

    // Get user's opt-in status for next drop
    let optedIn = false;
    if (nextDrop) {
      const optInResult = await pool.query(
        `SELECT opted_in FROM drop_opt_ins
         WHERE user_id = $1 AND drop_event_id = $2`,
        [req.userId, nextDrop.id]
      );

      if (optInResult.rows.length > 0) {
        optedIn = optInResult.rows[0].opted_in;
      }
    }

    // Get previous drop info
    const prevDropResult = await pool.query(
      `SELECT id, event_date, status FROM weekly_drop_events
       WHERE event_date <= NOW()
       ORDER BY event_date DESC
       LIMIT 1`
    );

    const prevDrop = prevDropResult.rows[0];

    res.json({
      nextDrop: nextDrop ? {
        id: nextDrop.id,
        eventDate: nextDrop.event_date,
        optedIn,
      } : null,
      lastDrop: prevDrop ? {
        id: prevDrop.id,
        eventDate: prevDrop.event_date,
      } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch drop status' });
  }
});

// Opt in or out for weekly drop
router.post('/drop/optin', authMiddleware, async (req, res) => {
  const { optIn } = req.body; // true or false

  try {
    // Get or create next drop event
    let dropEventResult = await pool.query(
      `SELECT id FROM weekly_drop_events
       WHERE event_date > NOW()
       ORDER BY event_date ASC
       LIMIT 1`
    );

    let dropEventId;
    if (dropEventResult.rows.length === 0) {
      // Create next Sunday 10 AM event
      const nextSunday = getNextSunday10AM();
      const createResult = await pool.query(
        `INSERT INTO weekly_drop_events (event_date, status)
         VALUES ($1, 'pending')
         RETURNING id`,
        [nextSunday]
      );
      dropEventId = createResult.rows[0].id;
    } else {
      dropEventId = dropEventResult.rows[0].id;
    }

    // Update or insert opt-in
    await pool.query(
      `INSERT INTO drop_opt_ins (user_id, drop_event_id, opted_in)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, drop_event_id)
       DO UPDATE SET opted_in = $3`,
      [req.userId, dropEventId, optIn]
    );

    res.json({
      message: optIn ? 'Opted in to weekly drop' : 'Opted out of weekly drop',
      optedIn: optIn,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update opt-in status' });
  }
});

// Helper function to get next Sunday 10 AM
function getNextSunday10AM() {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Calculate days until next Sunday
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;

  const nextSunday = new Date(now);
  nextSunday.setDate(nextSunday.getDate() + daysUntilSunday);
  nextSunday.setHours(10, 0, 0, 0);

  return nextSunday;
}

module.exports = router;
