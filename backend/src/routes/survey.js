const express = require('express');
const authMiddleware = require('../middleware/auth');
const pool = require('../db');
const surveyQuestions = require('../utils/surveyQuestions');

const router = express.Router();

// Get all survey questions
router.get('/questions', authMiddleware, async (req, res) => {
  try {
    res.json(surveyQuestions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get survey progress for user
router.get('/progress', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT section, COUNT(*) as answered_count
       FROM survey_responses
       WHERE user_id = $1
       GROUP BY section
       ORDER BY section`,
      [req.userId]
    );

    const progress = {};
    for (let i = 1; i <= 6; i++) {
      const section = result.rows.find(r => r.section === i);
      progress[i] = {
        answered: section ? parseInt(section.answered_count) : 0,
        total: surveyQuestions[i].questions.length,
      };
    }

    res.json(progress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get responses for a specific section
router.get('/section/:section', authMiddleware, async (req, res) => {
  const { section } = req.params;

  try {
    if (!surveyQuestions[section]) {
      return res.status(400).json({ error: 'Invalid section' });
    }

    const result = await pool.query(
      'SELECT question_id, value, importance_weight, confidence FROM survey_responses WHERE user_id = $1 AND section = $2 ORDER BY question_id',
      [req.userId, section]
    );

    const responses = {};
    result.rows.forEach(row => {
      responses[row.question_id] = {
        value: row.value,
        importance_weight: row.importance_weight,
        confidence: row.confidence,
      };
    });

    res.json({
      section: parseInt(section),
      questions: surveyQuestions[section].questions,
      responses,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

// Save responses for a section
router.post('/section/:section', authMiddleware, async (req, res) => {
  const { section } = req.params;
  const { responses } = req.body;

  try {
    if (!surveyQuestions[section]) {
      return res.status(400).json({ error: 'Invalid section' });
    }

    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({ error: 'Invalid responses format' });
    }

    // Save each response
    for (const [questionId, answerData] of Object.entries(responses)) {
      if (!answerData.value) continue; // Skip empty answers

      await pool.query(
        `INSERT INTO survey_responses (user_id, section, question_id, value, importance_weight, confidence)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, section, question_id)
         DO UPDATE SET value = $4, importance_weight = $5, confidence = $6, updated_at = NOW()`,
        [
          req.userId,
          section,
          parseInt(questionId),
          JSON.stringify(answerData.value),
          answerData.importance_weight || 'somewhat',
          answerData.confidence || 100,
        ]
      );
    }

    res.json({ message: `Section ${section} saved successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save responses' });
  }
});

// Get all responses for user (for matching algorithm)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT section, question_id, value, importance_weight FROM survey_responses WHERE user_id = $1 ORDER BY section, question_id',
      [req.userId]
    );

    const allResponses = {};
    result.rows.forEach(row => {
      if (!allResponses[row.section]) {
        allResponses[row.section] = {};
      }
      allResponses[row.section][row.question_id] = {
        value: row.value,
        importance_weight: row.importance_weight,
      };
    });

    res.json(allResponses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all responses' });
  }
});

module.exports = router;
