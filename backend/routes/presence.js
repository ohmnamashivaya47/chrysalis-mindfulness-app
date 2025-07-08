// CHRYSALIS - Presence Sessions Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const { presenceHelpers } = require('../lib/neon-db.js');
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

// GET /api/presence/sessions
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const { period = 'day', limit = 100 } = req.query;
    
    const sessions = await presenceHelpers.getPresenceSessions({
      userId: req.userId,
      period,
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      sessions,
      period
    });

  } catch (error) {
    console.error('Get presence sessions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get presence sessions',
      message: error.message
    });
  }
});

// POST /api/presence/sessions
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const {
      duration,
      presence_score,
      interruption_count,
      session_quality,
      notes
    } = req.body;

    // Validate required fields
    if (!duration || presence_score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Duration and presence score are required'
      });
    }

    // Create presence session record
    const sessionData = {
      user_id: req.userId,
      duration: parseInt(duration),
      presence_score: parseFloat(presence_score),
      interruption_count: interruption_count || 0,
      session_quality: session_quality || null,
      notes: notes || null,
      created_at: new Date().toISOString()
    };

    const sessionId = await presenceHelpers.createSession(sessionData);

    res.status(201).json({
      success: true,
      sessionId,
      message: 'Presence session recorded successfully'
    });

  } catch (error) {
    console.error('Create presence session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record presence session',
      message: error.message
    });
  }
});

// GET /api/presence/stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const stats = await presenceHelpers.getPresenceStats({
      userId: req.userId,
      period
    });
    
    res.json({
      success: true,
      stats,
      period
    });

  } catch (error) {
    console.error('Get presence stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get presence stats',
      message: error.message
    });
  }
});

module.exports = router;
