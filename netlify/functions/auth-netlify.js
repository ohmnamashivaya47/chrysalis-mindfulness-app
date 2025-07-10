// Authentication Function using Netlify Blobs
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getStore } = require('@netlify/blobs');

// JWT Configuration - Same as auth-utils
const JWT_SECRET = process.env.JWT_SECRET || 'chrysalis-meditation-app-secret-key-production-2024';

// Initialize user store
const usersStore = getStore('users');

// Helper functions for user management
const userHelpers = {
  generateId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  },

  async createUser(userData) {
    const user = {
      id: this.generateId(),
      email: userData.email,
      passwordHash: userData.passwordHash,
      displayName: userData.displayName || userData.email.split('@')[0],
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      profile: {
        joinedAt: new Date().toISOString(),
        totalSessions: 0,
        totalPresenceTime: 0,
        currentStreak: 0,
        longestStreak: 0,
        preferredSessionLength: 300,
        reminderFrequency: 'hourly'
      }
    };
    
    await usersStore.set(user.id, JSON.stringify(user));
    return user;
  },

  async getUserByEmail(email) {
    try {
      const userList = await usersStore.list();
      for (const { key } of userList.blobs) {
        const userData = await usersStore.get(key);
        if (userData) {
          const user = JSON.parse(userData);
          if (user.email === email) {
            return user;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  async getUserById(id) {
    try {
      const userData = await usersStore.get(id);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  async updateLastLogin(id) {
    try {
      const user = await this.getUserById(id);
      if (user) {
        user.lastLoginAt = new Date().toISOString();
        await usersStore.set(id, JSON.stringify(user));
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error updating last login:', error);
      return null;
    }
  }
};

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const path = event.path.replace('/.netlify/functions/auth', '');
    const method = event.httpMethod;

    // Sign Up
    if (path === '/signup' && method === 'POST') {
      const { email, password, displayName } = JSON.parse(event.body);

      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Email and password are required'
          })
        };
      }

      // Check if user already exists
      const existingUser = await userHelpers.getUserByEmail(email);
      if (existingUser) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'User already exists with this email'
          })
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await userHelpers.createUser({
        email,
        passwordHash,
        displayName
      });

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            user: userResponse,
            token
          }
        })
      };
    }

    // Sign In
    if (path === '/signin' && method === 'POST') {
      const { email, password } = JSON.parse(event.body);

      if (!email || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Email and password are required'
          })
        };
      }

      // Find user
      const user = await userHelpers.getUserByEmail(email);
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid email or password'
          })
        };
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid email or password'
          })
        };
      }

      // Update last login
      await userHelpers.updateLastLogin(user.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: {
            user: userResponse,
            token
          }
        })
      };
    }

    // Get Current User (from JWT token)
    if (path === '/me' && method === 'GET') {
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Authorization token required'
          })
        };
      }

      const token = authHeader.split(' ')[1];
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await userHelpers.getUserById(decoded.userId);
        
        if (!user) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({
              success: false,
              error: 'User not found'
            })
          };
        }

        // Remove password hash from response
        const { passwordHash: _, ...userResponse } = user;

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: { user: userResponse }
          })
        };
      } catch (error) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            success: false,
            error: 'Invalid or expired token'
          })
        };
      }
    }

    // Route not found
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Route not found'
      })
    };

  } catch (error) {
    console.error('Auth function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error'
      })
    };
  }
};
