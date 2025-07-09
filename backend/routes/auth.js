// CHRYSALIS - Authentication Routes
// Migrated from Netlify Functions to Express routes

const express = require('express');
const { userHelpers } = require('../lib/neon-db.js');
const { authUtils, responseHelpers, inputValidation, errorHandler } = require('../lib/auth-utils.js');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    console.log('Login request body:', JSON.stringify(req.body, null, 2));
    
    const { email, password } = req.body;

    // Validate input
    const validation = inputValidation.validateLogin({ email, password });
    if (!validation.isValid) {
      console.log('Login validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Find user by email
    const user = await userHelpers.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await authUtils.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = authUtils.generateToken(user.id, user.email);

    // Return user data (without password)
    const { password_hash, ...userData } = user;
    
    res.json({
      success: true,
      user: userData,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request body:', JSON.stringify(req.body, null, 2));
    
    const { email, password, display_name } = req.body;

    // Validate input
    const validation = inputValidation.validateRegistration({ email, password, display_name });
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    // Check if user already exists
    const existingUser = await userHelpers.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // Hash password
    const passwordHash = await authUtils.hashPassword(password);

    // Create user
    const newUser = await userHelpers.create({
      email,
      password_hash: passwordHash,
      display_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    // Generate JWT token
    const token = authUtils.generateToken(newUser.id, newUser.email);

    // Return user data (without password)
    const { password_hash, ...userData } = newUser;
    
    res.status(201).json({
      success: true,
      user: userData,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: error.message
    });
  }
});

// POST /api/auth/verify
router.post('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const decoded = authUtils.verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Get user data
    const user = await userHelpers.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
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
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      error: 'Token verification failed'
    });
  }
});

module.exports = router;
