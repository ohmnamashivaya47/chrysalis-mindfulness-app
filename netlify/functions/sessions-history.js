const { sessionHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  if (event.httpMethod !== 'GET') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Initialize database
    await initDB();

    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    // Get user's session history with statistics
    const sessionHistory = await sessionHelpers.getUserSessionHistory(authUser.userId);

    return responseHelpers.success(sessionHistory, 'Session history retrieved successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Session History');
  }
};
module.exports = { handler };
