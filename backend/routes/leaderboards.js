// CHRYSALIS - Leaderboards Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const { leaderboardHelpers } = require('../lib/neon-db.js');
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

// GET /api/leaderboards/global
router.get('/global', authenticateToken, async (req, res) => {
  try {
    const { period = 'week', limit = 50 } = req.query;
    
    const leaderboard = await leaderboardHelpers.getGlobalLeaderboard({
      period,
      limit: parseInt(limit),
      userId: req.userId
    });
    
    res.json({
      success: true,
      leaderboard,
      period,
      type: 'global'
    });

  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get global leaderboard',
      message: error.message
    });
  }
});

// GET /api/leaderboards/friends
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const leaderboard = await leaderboardHelpers.getFriendsLeaderboard({
      period,
      userId: req.userId
    });
    
    res.json({
      success: true,
      leaderboard,
      period,
      type: 'friends'
    });

  } catch (error) {
    console.error('Get friends leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get friends leaderboard',
      message: error.message
    });
  }
});

// GET /api/leaderboards/local
router.get('/local', authenticateToken, async (req, res) => {
  try {
    const { period = 'week', radius = 50 } = req.query;
    
    // For now, return global leaderboard as local
    // TODO: Implement geolocation-based filtering
    const leaderboard = await leaderboardHelpers.getGlobalLeaderboard({
      period,
      limit: 50,
      userId: req.userId
    });
    
    res.json({
      success: true,
      leaderboard,
      period,
      type: 'local',
      radius: parseInt(radius)
    });

  } catch (error) {
    console.error('Get local leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get local leaderboard',
      message: error.message
    });
  }
});

module.exports = router;
