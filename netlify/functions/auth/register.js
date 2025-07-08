// CHRYSALIS - User Registration Function
// Handles new user account creation with validation and security

import { userHelpers, validators } from '../lib/neon-db.js';
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
    const { email, password, displayName } = JSON.parse(event.body || '{}');

    // Get client IP for rate limiting
    const clientIP = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    
    // Apply rate limiting (5 attempts per 15 minutes per IP)
    authUtils.rateLimiter.checkRateLimit(`register:${clientIP}`, 5, 15 * 60 * 1000);
    authUtils.rateLimiter.checkRateLimit(`register:${email}`, 3, 60 * 60 * 1000); // 3 per hour per email

    // Validate input data
    const emailValidation = inputValidation.email(email);
    if (!emailValidation.valid) {
      return responseHelpers.error(emailValidation.message, 400);
    }

    const passwordValidation = authUtils.validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return responseHelpers.error(passwordValidation.message, 400);
    }

    const nameValidation = inputValidation.displayName(displayName);
    if (!nameValidation.valid) {
      return responseHelpers.error(nameValidation.message, 400);
    }

    // Hash the password
    const passwordHash = await authUtils.hashPassword(password);

    // Create user account
    const userData = {
      email: email.toLowerCase().trim(),
      passwordHash,
      displayName: displayName.trim()
    };

    const newUser = await userHelpers.createUser(userData);

    // Generate JWT token
    const token = authUtils.generateToken(newUser);

    // Clear rate limiting on successful registration
    authUtils.rateLimiter.clearRateLimit(`register:${clientIP}`);
    authUtils.rateLimiter.clearRateLimit(`register:${email}`);

    // Return success response with user data and token
    const sanitizedUser = authUtils.sanitizeUser(newUser);
    
    return responseHelpers.success({
      user: sanitizedUser,
      token
    }, 'Account created successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'User Registration');
  }
};
