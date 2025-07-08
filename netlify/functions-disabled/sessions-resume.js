const { sessionHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler } = require('./lib/auth-utils.js');

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

    // Resume the session
    const resumedSession = await sessionHelpers.resumeSession(sessionId, authUser.userId);

    return responseHelpers.success({
      session: resumedSession
    }, 'Session resumed successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Resume Session');
  }
};
module.exports = { handler };
