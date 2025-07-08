const { sessionHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler, inputValidation } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  if (event.httpMethod !== 'POST') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Initialize database
    await initDB();

    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    // Parse request body
    const { sessionId } = JSON.parse(event.body || '{}');

    if (!sessionId) {
      return responseHelpers.error('Session ID is required', 400);
    }

    // Pause the session
    const pausedSession = await sessionHelpers.pauseSession(sessionId, authUser.userId);

    return responseHelpers.success({
      session: pausedSession
    }, 'Session paused successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Pause Session');
  }
};
module.exports = { handler };
