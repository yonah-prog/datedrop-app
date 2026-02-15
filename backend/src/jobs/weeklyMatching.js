const cron = require('node-cron');
const pool = require('../db');
const { calculateMatchScore } = require('../utils/matchingAlgorithm');

let matchingJobScheduled = false;

// Schedule matching job: Every Sunday at 10 AM ET
// Cron format: minute hour day_of_month month day_of_week
function scheduleWeeklyMatching() {
  if (matchingJobScheduled) {
    console.log('Matching job already scheduled');
    return;
  }

  // 0 10 * * 0 = Sunday 10 AM
  cron.schedule('0 10 * * 0', async () => {
    console.log('[Matching Job] Starting weekly matching at', new Date().toISOString());
    try {
      await runWeeklyMatching();
    } catch (err) {
      console.error('[Matching Job] Error during matching:', err);
    }
  });

  matchingJobScheduled = true;
  console.log('✓ Weekly matching job scheduled for Sundays at 10 AM ET');
}

async function runWeeklyMatching() {
  try {
    // 1. Get or create weekly drop event
    const dropEventResult = await pool.query(
      `INSERT INTO weekly_drop_events (event_date, status)
       VALUES (NOW(), 'pending')
       ON CONFLICT (event_date) DO UPDATE SET status = 'pending'
       RETURNING id`
    );

    const dropEventId = dropEventResult.rows[0].id;
    console.log(`[Matching Job] Drop event ID: ${dropEventId}`);

    // 2. Get all opted-in users
    const optedInResult = await pool.query(
      `SELECT DISTINCT doi.user_id
       FROM drop_opt_ins doi
       WHERE doi.opted_in = true
       AND doi.drop_event_id = $1`,
      [dropEventId]
    );

    const optedInUsers = optedInResult.rows.map(row => row.user_id);
    console.log(`[Matching Job] Found ${optedInUsers.length} opted-in users`);

    if (optedInUsers.length < 2) {
      console.log('[Matching Job] Not enough users to create matches');
      await pool.query(
        'UPDATE weekly_drop_events SET status = $1 WHERE id = $2',
        ['completed', dropEventId]
      );
      return;
    }

    // 3. Get all user profiles and survey responses
    const usersData = {};
    for (const userId of optedInUsers) {
      const profileResult = await pool.query(
        'SELECT id, user_id, where_from, where_live, city, state, location_radius FROM profiles WHERE user_id = $1',
        [userId]
      );

      const surveyResult = await pool.query(
        `SELECT section, question_id, value, importance_weight
         FROM survey_responses
         WHERE user_id = $1`,
        [userId]
      );

      // Organize responses by section
      const responses = {};
      surveyResult.rows.forEach(row => {
        if (!responses[row.section]) {
          responses[row.section] = {};
        }
        responses[row.section][row.question_id] = {
          value: row.value,
          importance_weight: row.importance_weight,
        };
      });

      usersData[userId] = {
        profile: profileResult.rows[0] || {},
        responses,
      };
    }

    // 4. Calculate compatibility scores between all pairs
    const matches = [];
    for (let i = 0; i < optedInUsers.length; i++) {
      for (let j = i + 1; j < optedInUsers.length; j++) {
        const user1Id = optedInUsers[i];
        const user2Id = optedInUsers[j];

        // Check if already matched or blocked
        const existingMatch = await pool.query(
          `SELECT id, status FROM matches
           WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)`,
          [user1Id, user2Id]
        );

        if (existingMatch.rows.length > 0) {
          const match = existingMatch.rows[0];
          // Skip if already matched or denied
          if (match.status !== 'expired') {
            continue;
          }
        }

        // Check if blocked
        const blocked = await pool.query(
          `SELECT id FROM blocked_users
           WHERE (blocker_id = $1 AND blocked_id = $2) OR (blocker_id = $2 AND blocked_id = $1)`,
          [user1Id, user2Id]
        );

        if (blocked.rows.length > 0) {
          continue;
        }

        // Calculate score
        const scoreData = calculateMatchScore(
          usersData[user1Id].responses,
          usersData[user2Id].responses,
          usersData[user1Id].profile,
          usersData[user2Id].profile
        );

        if (scoreData.score > 0) {
          matches.push({
            user1Id,
            user2Id,
            score: scoreData.score,
            categoryScores: scoreData.categoryScores,
          });
        }
      }
    }

    console.log(`[Matching Job] Calculated ${matches.length} potential matches`);

    // 5. Sort by score and select top matches (limit to 1-3 per user)
    const selectedMatches = selectTopMatches(matches, optedInUsers.length);
    console.log(`[Matching Job] Selected ${selectedMatches.length} final matches`);

    // 6. Save matches to database
    for (const match of selectedMatches) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days (next Sunday)

      await pool.query(
        `INSERT INTO matches (user1_id, user2_id, status, created_at, expires_at)
         VALUES ($1, $2, $3, NOW(), $4)
         ON CONFLICT (user1_id, user2_id) DO UPDATE
         SET status = 'active', created_at = NOW(), expires_at = $4`,
        [match.user1Id, match.user2Id, 'active', expiresAt]
      );
    }

    // 7. Mark expired matches as expired
    await pool.query(
      `UPDATE matches
       SET status = 'expired'
       WHERE expires_at < NOW() AND status = 'active'`
    );

    // 8. Mark drop event as completed
    await pool.query(
      'UPDATE weekly_drop_events SET status = $1 WHERE id = $2',
      ['completed', dropEventId]
    );

    // 9. Reset opt-ins for next week
    // Users must opt in again for next drop
    // (This can be done optionally - uncomment if desired)
    // await pool.query(
    //   'UPDATE drop_opt_ins SET opted_in = false WHERE drop_event_id = $1',
    //   [dropEventId]
    // );

    console.log(`[Matching Job] ✓ Weekly matching completed at ${new Date().toISOString()}`);
  } catch (err) {
    console.error('[Matching Job] Database error:', err);
    throw err;
  }
}

// Utility function to select top matches without duplicating users
function selectTopMatches(matches, totalUsers) {
  // Sort by score descending
  matches.sort((a, b) => b.score - a.score);

  // Select top matches, limiting to ~1-3 matches per user
  const userMatchCount = {};
  const maxMatchesPerUser = Math.max(1, Math.ceil(3 * matches.length / (totalUsers * totalUsers)));

  return matches.filter(match => {
    const count1 = userMatchCount[match.user1Id] || 0;
    const count2 = userMatchCount[match.user2Id] || 0;

    if (count1 < maxMatchesPerUser && count2 < maxMatchesPerUser) {
      userMatchCount[match.user1Id] = count1 + 1;
      userMatchCount[match.user2Id] = count2 + 1;
      return true;
    }
    return false;
  });
}

module.exports = {
  scheduleWeeklyMatching,
  runWeeklyMatching,
};
