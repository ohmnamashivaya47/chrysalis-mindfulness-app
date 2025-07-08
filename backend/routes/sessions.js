// CHRYSALIS - Session Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const { sessionHelpers, userHelpers } = require('../lib/neon-db.js');
const { authUtils } = require('../lib/auth-utils.js');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  const token = authHeader.substring(7);
  try {
    const decoded = authUtils.verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Token verification failed'
    });
  }
};

// POST /api/sessions/complete
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const {
      duration,
      type,
      frequency,
      notes,
      mood_before,
      mood_after,
      focus_rating,
      gratitude_note
    } = req.body;

    // Validate required fields
    if (!duration || !type) {
      return res.status(400).json({
        success: false,
        error: 'Duration and type are required'
      });
    }

    // Create session record
    const sessionData = {
      user_id: req.userId,
      duration: parseInt(duration),
      session_type: type,
      frequency: frequency || 'alpha',
      notes: notes || null,
      mood_before: mood_before || null,
      mood_after: mood_after || null,
      focus_rating: focus_rating || null,
      gratitude_note: gratitude_note || null,
      completed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    const sessionId = await sessionHelpers.create(sessionData);

    // Update user stats
    await userHelpers.updateSessionStats(req.userId, {
      total_sessions: 1,
      total_minutes: parseInt(duration),
      last_session_date: new Date().toISOString()
    });

    res.json({
      success: true,
      sessionId,
      message: 'Session completed successfully'
    });

  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete session',
      message: error.message
    });
  }
});

// GET /api/sessions/history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const sessions = await sessionHelpers.getUserSessions(req.userId, {
      limit: parseInt(limit),
      offset
    });

    const totalSessions = await sessionHelpers.getUserSessionCount(req.userId);

    res.json({
      success: true,
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalSessions,
        pages: Math.ceil(totalSessions / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get session history',
      message: error.message
    });
  }
});

// POST /api/sessions/pause
router.post('/pause', authenticateToken, async (req, res) => {
  try {
    const { sessionId, pausedAt } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Update session with pause time
    await sessionHelpers.updatePauseState(sessionId, {
      paused_at: pausedAt || new Date().toISOString(),
      is_paused: true
    });

    res.json({
      success: true,
      message: 'Session paused successfully'
    });

  } catch (error) {
    console.error('Pause session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause session',
      message: error.message
    });
  }
});

// POST /api/sessions/resume
router.post('/resume', authenticateToken, async (req, res) => {
  try {
    const { sessionId, resumedAt } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }

    // Update session with resume time
    await sessionHelpers.updatePauseState(sessionId, {
      resumed_at: resumedAt || new Date().toISOString(),
      is_paused: false
    });

    res.json({
      success: true,
      message: 'Session resumed successfully'
    });

  } catch (error) {
    console.error('Resume session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume session',
      message: error.message
    });
  }
});

module.exports = router;
