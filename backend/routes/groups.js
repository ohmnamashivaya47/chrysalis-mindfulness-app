// CHRYSALIS - Groups Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const { groupHelpers, userHelpers, socialHelpers, db } = require('../lib/neon-db.js');
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

// GET /api/groups/list
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const groups = await groupHelpers.getUserGroups(req.userId);
    
    res.json({
      success: true,
      groups
    });

  } catch (error) {
    console.error('Get groups list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get groups list',
      message: error.message
    });
  }
});

// GET /api/groups/public
router.get('/public', authenticateToken, async (req, res) => {
  try {
    const groups = await db.groups.getPublicGroups();
    
    res.json({
      success: true,
      groups
    });

  } catch (error) {
    console.error('Get public groups error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get public groups',
      message: error.message
    });
  }
});

// GET /api/groups/:id/details
router.get('/:id/details', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const group = await groupHelpers.getGroupDetails(id, req.userId);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }
    
    res.json({
      success: true,
      group
    });

  } catch (error) {
    console.error('Get group details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group details',
      message: error.message
    });
  }
});

// POST /api/groups/create
router.post('/create', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      isPublic, // From frontend
      privacy_level,
      max_members,
      meditation_focus,
      group_image
    } = req.body;

    // Validate required fields - only name is required
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Group name is required'
      });
    }

    // Generate a unique group code
    const groupCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create group
    const groupData = {
      name: name.trim(),
      description: description?.trim() || 'A mindful group for meditation practice.',
      privacy_level: isPublic !== undefined ? (isPublic ? 'public' : 'private') : (privacy_level || 'public'),
      max_members: max_members || 50,
      meditation_focus: meditation_focus || null,
      group_image: group_image || null,
      group_code: groupCode,
      created_by: req.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const groupId = await groupHelpers.createGroup(groupData);

    // Add creator as admin member
    await groupHelpers.addMember(groupId, req.userId, 'admin');

    res.status(201).json({
      success: true,
      groupId,
      code: groupCode,
      message: 'Group created successfully'
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create group',
      message: error.message
    });
  }
});

// POST /api/groups/:id/join
router.post('/:id/join', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if group exists
    const group = await groupHelpers.getGroupById(id);
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is already a member
    const isMember = await groupHelpers.isGroupMember(id, req.userId);
    if (isMember) {
      return res.status(409).json({
        success: false,
        error: 'Already a member of this group'
      });
    }

    // Check if group is full
    const memberCount = await groupHelpers.getGroupMemberCount(id);
    if (memberCount >= group.max_members) {
      return res.status(409).json({
        success: false,
        error: 'Group is full'
      });
    }

    // Add user to group
    await groupHelpers.addMember(id, req.userId, 'member');

    res.json({
      success: true,
      message: 'Successfully joined group'
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join group',
      message: error.message
    });
  }
});

// POST /api/groups/join-by-code - For QR code functionality
router.post('/join-by-code', authenticateToken, async (req, res) => {
  try {
    const { groupCode } = req.body;
    
    if (!groupCode) {
      return res.status(400).json({
        success: false,
        error: 'Group code is required'
      });
    }

    // Find group by code
    const group = await db.groups.findByCode(groupCode.trim().toUpperCase());
    if (!group) {
      return res.status(404).json({
        success: false,
        error: 'Group not found'
      });
    }

    // Check if user is already a member
    const isMember = await groupHelpers.isGroupMember(group.id, req.userId);
    if (isMember) {
      return res.status(409).json({
        success: false,
        error: 'Already a member of this group'
      });
    }

    // Check if group is full
    const memberCount = await groupHelpers.getGroupMemberCount(group.id);
    if (memberCount >= (group.max_members || 100)) {
      return res.status(409).json({
        success: false,
        error: 'Group is full'
      });
    }

    // Add user to group
    await groupHelpers.addMember(group.id, req.userId, 'member');

    res.json({
      success: true,
      message: 'Successfully joined group',
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        groupCode: group.group_code
      }
    });

  } catch (error) {
    console.error('Join group by code error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join group',
      message: error.message
    });
  }
});

// POST /api/groups/:id/leave
router.post('/:id/leave', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is a member
    const isMember = await groupHelpers.isGroupMember(id, req.userId);
    if (!isMember) {
      return res.status(404).json({
        success: false,
        error: 'Not a member of this group'
      });
    }

    // Remove user from group
    await groupHelpers.removeMember(id, req.userId);

    res.json({
      success: true,
      message: 'Successfully left group'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave group',
      message: error.message
    });
  }
});

// GET /api/groups/:id/leaderboard
router.get('/:id/leaderboard', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { period = 'week' } = req.query;
    
    // Check if user is a member
    const isMember = await groupHelpers.isGroupMember(id, req.userId);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        error: 'Not a member of this group'
      });
    }

    const leaderboard = await groupHelpers.getGroupLeaderboard(id, period);
    
    res.json({
      success: true,
      leaderboard,
      period
    });

  } catch (error) {
    console.error('Get group leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get group leaderboard',
      message: error.message
    });
  }
});

module.exports = router;
