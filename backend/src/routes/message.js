const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');

const router = express.Router();

// Get messages for a match
router.get('/:matchId', authMiddleware, async (req, res) => {
  const { matchId } = req.params;

  try {
    // Verify user is part of this match and not denied
    const matchResult = await pool.query(
      `SELECT id, user1_id, user2_id, status FROM matches
       WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [matchId, req.userId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Check if match is denied
    if (match.status.includes('denied')) {
      return res.status(403).json({ error: 'This match has been ended' });
    }

    // Get all messages for this match
    const messagesResult = await pool.query(
      `SELECT id, sender_id, receiver_id, content, created_at
       FROM messages
       WHERE match_id = $1
       ORDER BY created_at ASC`,
      [matchId]
    );

    // Get the other user's info for context
    const otherUserId = match.user1_id === req.userId ? match.user2_id : match.user1_id;
    const userResult = await pool.query(
      `SELECT id, full_name FROM users WHERE id = $1`,
      [otherUserId]
    );

    res.json({
      matchId,
      otherUser: userResult.rows[0],
      messages: messagesResult.rows.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        senderName: msg.sender_id === req.userId ? 'You' : userResult.rows[0].full_name,
        content: msg.content,
        createdAt: msg.created_at,
        isOwn: msg.sender_id === req.userId,
      })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send message to a match
router.post('/:matchId/send', authMiddleware, async (req, res) => {
  const { matchId } = req.params;
  const { content } = req.body;

  try {
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (content.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 chars)' });
    }

    // Verify user is part of this match
    const matchResult = await pool.query(
      `SELECT id, user1_id, user2_id, status FROM matches
       WHERE id = $1 AND (user1_id = $2 OR user2_id = $2)`,
      [matchId, req.userId]
    );

    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const match = matchResult.rows[0];

    // Check if match is still active
    if (match.status !== 'active') {
      return res.status(403).json({ error: 'Cannot message this match' });
    }

    // Determine receiver
    const receiverId = match.user1_id === req.userId ? match.user2_id : match.user1_id;

    // Save message
    const messageResult = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, match_id, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, created_at`,
      [req.userId, receiverId, matchId, content.trim()]
    );

    const message = messageResult.rows[0];

    res.status(201).json({
      id: message.id,
      senderId: req.userId,
      receiverId,
      content: content.trim(),
      createdAt: message.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get all message threads for user
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get all active matches with latest message
    const result = await pool.query(
      `SELECT DISTINCT ON (m.id)
              m.id, m.user1_id, m.user2_id, m.created_at,
              u.full_name, p.city, p.state,
              msg.content as last_message, msg.created_at as last_message_time
       FROM matches m
       JOIN users u ON CASE WHEN m.user1_id = $1 THEN m.user2_id = u.id ELSE m.user1_id = u.id END
       JOIN profiles p ON u.id = p.user_id
       LEFT JOIN messages msg ON m.id = msg.match_id
       WHERE (m.user1_id = $1 OR m.user2_id = $1)
       AND m.status = 'active'
       ORDER BY m.id, msg.created_at DESC`,
      [req.userId]
    );

    const threads = result.rows.map(row => ({
      matchId: row.id,
      otherUserId: row.user1_id === req.userId ? row.user2_id : row.user1_id,
      otherUserName: row.full_name,
      otherUserLocation: `${row.city}, ${row.state}`,
      lastMessage: row.last_message || 'No messages yet',
      lastMessageTime: row.last_message_time,
      matchedAt: row.created_at,
    }));

    res.json(threads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch message threads' });
  }
});

module.exports = router;
