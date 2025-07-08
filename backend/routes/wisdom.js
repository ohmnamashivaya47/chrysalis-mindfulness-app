// CHRYSALIS - Wisdom Quotes Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const { wisdomHelpers } = require('../lib/neon-db.js');
const { authUtils } = require('../lib/auth-utils.js');

const router = express.Router();

// Middleware to verify JWT token (optional for wisdom quotes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = authUtils.verifyToken(token);
      if (decoded && decoded.userId) {
        req.userId = decoded.userId;
      }
    } catch (error) {
      // Token verification failed, but continue without user ID
    }
  }
  next();
};

// GET /api/wisdom/quotes
router.get('/quotes', authenticateToken, async (req, res) => {
  try {
    const { category, limit = 1 } = req.query;
    
    const quotes = await wisdomHelpers.getRandomQuotes({
      category: category || null,
      limit: parseInt(limit),
      userId: req.userId || null
    });
    
    res.json({
      success: true,
      quotes: limit == 1 ? quotes[0] : quotes
    });

  } catch (error) {
    console.error('Get wisdom quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wisdom quotes',
      message: error.message
    });
  }
});

// GET /api/wisdom/quotes/daily
router.get('/quotes/daily', authenticateToken, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get daily quote based on date (deterministic)
    const quote = await wisdomHelpers.getDailyQuote(today);
    
    res.json({
      success: true,
      quote,
      date: today
    });

  } catch (error) {
    console.error('Get daily wisdom quote error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily wisdom quote',
      message: error.message
    });
  }
});

// GET /api/wisdom/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await wisdomHelpers.getCategories();
    
    res.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get wisdom categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get wisdom categories',
      message: error.message
    });
  }
});

module.exports = router;
