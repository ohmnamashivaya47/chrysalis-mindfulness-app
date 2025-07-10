// CHRYSALIS - Authentication Utilities
// JWT token management and security functions

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'chrysalis-meditation-app-secret-key-production-2024';
const JWT_EXPIRES_IN = '7d';

// Authentication helper functions
const authUtils = {
  // Hash password using bcrypt
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  },

  // Verify password against hash
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  },

  // Generate JWT token for user
  generateToken(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });
  },

  // Verify and decode JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  },

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Missing or invalid Authorization header');
    }
    return authHeader.substring(7);
  },

  // Get user from request (authentication middleware)
  async authenticateRequest(event) {
    try {
      const authHeader = event.headers.authorization;
      const token = this.extractTokenFromHeader(authHeader);
      const decoded = this.verifyToken(token);
      
      return {
        userId: decoded.userId,
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Authentication failed: ' + error.message);
    }
  },

  // Create sanitized user response (remove sensitive data)
  sanitizeUser(user) {
    const sanitized = { ...user };
    delete sanitized.passwordHash;
    return sanitized;
  },

  // Validate password strength
  validatePasswordStrength(password) {
    if (!password) {
      return { valid: false, message: 'Password is required' };
    }
    
    if (password.length < 6) {
      return { valid: false, message: 'Password must be at least 6 characters long' };
    }
    
    if (password.length > 128) {
      return { valid: false, message: 'Password must be less than 128 characters' };
    }
    
    // Optional: Add more complex validation
    // const hasUpperCase = /[A-Z]/.test(password);
    // const hasLowerCase = /[a-z]/.test(password);
    // const hasNumbers = /\d/.test(password);
    // const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return { valid: true, message: 'Password is valid' };
  },

  // Rate limiting helper (simple in-memory store)
  rateLimiter: {
    attempts: new Map(),
    
    // Check if IP/email has exceeded rate limit
    checkRateLimit(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
      const now = Date.now();
      const userAttempts = this.attempts.get(identifier) || [];
      
      // Remove old attempts outside the window
      const recentAttempts = userAttempts.filter(time => now - time < windowMs);
      
      if (recentAttempts.length >= maxAttempts) {
        const oldestAttempt = Math.min(...recentAttempts);
        const timeUntilReset = windowMs - (now - oldestAttempt);
        throw new Error(`Too many attempts. Try again in ${Math.ceil(timeUntilReset / 60000)} minutes.`);
      }
      
      // Record this attempt
      recentAttempts.push(now);
      this.attempts.set(identifier, recentAttempts);
      
      return true;
    },
    
    // Clear rate limit for successful authentication
    clearRateLimit(identifier) {
      this.attempts.delete(identifier);
    }
  }
};

// Response helpers for consistent API responses
const responseHelpers = {
  // Success response
  success(data, message = 'Success') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message,
        data
      })
    };
  },

  // Error response
  error(message, statusCode = 400, details = null) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: JSON.stringify({
        success: false,
        message,
        details
      })
    };
  },

  // CORS preflight response
  cors() {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
      },
      body: ''
    };
  }
};

// Input validation helpers
const inputValidation = {
  // Validate email format
  email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return { valid: false, message: 'Email is required' };
    if (!emailRegex.test(email)) return { valid: false, message: 'Invalid email format' };
    if (email.length > 254) return { valid: false, message: 'Email too long' };
    return { valid: true };
  },

  // Validate display name
  displayName(name) {
    if (!name) return { valid: false, message: 'Display name is required' };
    const trimmed = name.trim();
    if (trimmed.length < 2) return { valid: false, message: 'Display name must be at least 2 characters' };
    if (trimmed.length > 50) return { valid: false, message: 'Display name must be less than 50 characters' };
    if (!/^[a-zA-Z0-9\s\-_\.]+$/.test(trimmed)) return { valid: false, message: 'Display name contains invalid characters' };
    return { valid: true };
  },

  // Validate meditation session data
  sessionData(data) {
    const errors = [];
    
    if (!data.duration || !Number.isInteger(data.duration)) {
      errors.push('Duration must be a valid integer');
    } else if (data.duration < 1 || data.duration > 120) {
      errors.push('Duration must be between 1 and 120 minutes');
    }
    
    if (!data.frequency || !['alpha', 'theta', 'beta', 'delta'].includes(data.frequency)) {
      errors.push('Frequency must be one of: alpha, theta, beta, delta');
    }
    
    if (data.type && typeof data.type !== 'string') {
      errors.push('Session type must be a string');
    }
    
    return {
      valid: errors.length === 0,
      messages: errors
    };
  },

  // Validate group data
  groupData(data) {
    const errors = [];
    
    if (!data.name || typeof data.name !== 'string') {
      errors.push('Group name is required');
    } else if (data.name.trim().length < 3 || data.name.trim().length > 50) {
      errors.push('Group name must be between 3 and 50 characters');
    }
    
    if (!data.description || typeof data.description !== 'string') {
      errors.push('Group description is required');
    } else if (data.description.trim().length < 10 || data.description.trim().length > 500) {
      errors.push('Group description must be between 10 and 500 characters');
    }
    
    return {
      valid: errors.length === 0,
      messages: errors
    };
  }
};

// Error handling helpers
const errorHandler = {
  // Handle and log errors consistently
  handleError(error, context = 'Unknown') {
    console.error(`[${context}] Error:`, error);
    
    // Don't expose internal errors to client
    if (error.message.includes('Internal') || error.message.includes('Database')) {
      return responseHelpers.error('An internal error occurred. Please try again later.', 500);
    }
    
    // Return the actual error message for validation errors
    return responseHelpers.error(error.message, error.statusCode || 400);
  }
};

// Export all utilities
module.exports = {
  authUtils,
  responseHelpers,
  inputValidation,
  errorHandler
};
