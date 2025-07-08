// CHRYSALIS - User Login Function
// Handles user authentication and session management

import { userHelpers } from '../lib/neon-db.js';
import { authUtils, responseHelpers, inputValidation, errorHandler } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Parse request body
    const { email, password } = JSON.parse(event.body || '{}');

    // Get client IP for rate limiting
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    
    // Apply rate limiting (10 attempts per 15 minutes per IP)
    authUtils.rateLimiter.checkRateLimit(`login:${clientIP}`, 10, 15 * 60 * 1000);
    authUtils.rateLimiter.checkRateLimit(`login:${email}`, 5, 15 * 60 * 1000); // 5 per 15 min per email

    // Validate input data
    const emailValidation = inputValidation.email(email);
    if (!emailValidation.valid) {
      return responseHelpers.error(emailValidation.message, 400);
    }

    if (!password) {
      return responseHelpers.error('Password is required', 400);
    }

    // Find user by email
    const user = await userHelpers.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
      return responseHelpers.error('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await authUtils.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return responseHelpers.error('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = authUtils.generateToken(user);

    // Update last login time (optional)
    await userHelpers.updateUser(user.id, {
      lastLoginAt: new Date().toISOString()
    });

    // Clear rate limiting on successful login
    authUtils.rateLimiter.clearRateLimit(`login:${clientIP}`);
    authUtils.rateLimiter.clearRateLimit(`login:${email}`);

    // Return success response with user data and token
    const sanitizedUser = authUtils.sanitizeUser(user);
    
    return responseHelpers.success({
      user: sanitizedUser,
      token
    }, 'Login successful');

  } catch (error) {
    return errorHandler.handleError(error, 'User Login');
  }
};
