// CHRYSALIS - User Profile Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const multer = require('multer');
const { userHelpers } = require('../lib/neon-db.js');
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

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 0.5 * 1024 * 1024, // 0.5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// GET /api/users/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await userHelpers.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Return user data (without password)
    const { password_hash, ...userData } = user;
    
    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile',
      message: error.message
    });
  }
});

// PUT /api/users/profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      displayName,
      profilePicture,
      fullName,
      username,
      bio,
      meditationGoals,
      preferredSessionLength,
      reminderSettings,
      privacySettings,
      notificationSettings
    } = req.body;

    // Map frontend fields to database columns
    const updateData = {
      display_name: displayName || fullName, // Handle both field names
      profile_picture: profilePicture,
      full_name: fullName || displayName, // Fallback
      username,
      bio,
      meditation_goals: meditationGoals,
      preferred_session_length: preferredSessionLength,
      reminder_settings: reminderSettings,
      privacy_settings: privacySettings,
      notification_settings: notificationSettings,
      updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // Check if username is already taken (if updating username)
    if (username) {
      const existingUser = await userHelpers.findByUsername(username);
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(409).json({
          success: false,
          error: 'Username already taken'
        });
      }
    }

    await userHelpers.update(req.userId, updateData);

    // Get updated user data
    const updatedUser = await userHelpers.findById(req.userId);
    const { password_hash, ...userData } = updatedUser;
    
    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// POST /api/users/upload-profile-picture
router.post('/upload-profile-picture', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const cloudinary = require('cloudinary').v2;
    
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Upload to Cloudinary
    const uploadResponse = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'chrysalis/profile-pictures',
          public_id: `user-${req.userId}-${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Update user profile with new image URL
    await userHelpers.update(req.userId, {
      profile_picture: uploadResponse.secure_url,
      updated_at: new Date().toISOString()
    });

    // Get updated user data
    const updatedUser = await userHelpers.findById(req.userId);
    const { password_hash, ...userData } = updatedUser;

    res.json({
      success: true,
      user: userData,
      imageUrl: uploadResponse.secure_url
    });

  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile picture',
      message: error.message
    });
  }
});

module.exports = router;
