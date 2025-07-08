// CHRYSALIS - Friends Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const { friendHelpers, userHelpers } = require('../lib/neon-db.js');
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

// GET /api/friends/list
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const friends = await friendHelpers.getFriends(req.userId);
    
    res.json({
      success: true,
      friends
    });

  } catch (error) {
    console.error('Get friends list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get friends list',
      message: error.message
    });
  }
});

// GET /api/friends/requests
router.get('/requests', authenticateToken, async (req, res) => {
  try {
    const requests = await friendHelpers.getPendingRequests(req.userId);
    
    res.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get friend requests',
      message: error.message
    });
  }
});

// POST /api/friends/add
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { friendId, username } = req.body;
    let targetUserId = friendId;

    // If username provided instead of ID, find the user
    if (!targetUserId && username) {
      const user = await userHelpers.findByUsername(username);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }
      targetUserId = user.id;
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Friend ID or username is required'
      });
    }

    // Cannot add yourself as friend
    if (targetUserId === req.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot add yourself as friend'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await friendHelpers.checkFriendship(req.userId, targetUserId);
    if (existingFriendship) {
      return res.status(409).json({
        success: false,
        error: 'Friendship already exists or request pending'
      });
    }

    // Create friend request
    await friendHelpers.createRequest(req.userId, targetUserId);

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Add friend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send friend request',
      message: error.message
    });
  }
});

// POST /api/friends/accept
router.post('/accept', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    // Accept the friend request
    await friendHelpers.acceptRequest(requestId, req.userId);

    res.json({
      success: true,
      message: 'Friend request accepted successfully'
    });

  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to accept friend request',
      message: error.message
    });
  }
});

// POST /api/friends/decline
router.post('/decline', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        error: 'Request ID is required'
      });
    }

    // Decline the friend request
    await friendHelpers.declineRequest(requestId, req.userId);

    res.json({
      success: true,
      message: 'Friend request declined successfully'
    });

  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to decline friend request',
      message: error.message
    });
  }
});

// DELETE /api/friends/remove
router.delete('/remove', authenticateToken, async (req, res) => {
  try {
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({
        success: false,
        error: 'Friend ID is required'
      });
    }

    // Remove friendship
    await friendHelpers.removeFriend(req.userId, friendId);

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove friend',
      message: error.message
    });
  }
});

// GET /api/friends/search
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters'
      });
    }

    const users = await userHelpers.searchUsers(query, req.userId);
    
    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      message: error.message
    });
  }
});

module.exports = router;
