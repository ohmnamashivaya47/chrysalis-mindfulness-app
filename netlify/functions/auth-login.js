// CHRYSALIS - User Login Function
// Handles user authentication and session management

const { userHelpers } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, inputValidation, errorHandler } = require('./lib/auth-utils.js');

exports.handler = async (event, context) => {
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
    const isPasswordValid = await authUtils.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return responseHelpers.error('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = authUtils.generateToken(user);

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
