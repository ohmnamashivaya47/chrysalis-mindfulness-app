const { socialHelpers, initDB } = require('./lib/neon-db.js');
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
    const { requestId } = JSON.parse(event.body || '{}');

    if (!requestId) {
      return responseHelpers.error('Request ID is required', 400);
    }

    // Decline friend request
    await socialHelpers.friends.declineRequest(authUser.userId, requestId);

    return responseHelpers.success({}, 'Friend request declined successfully');
  } catch (error) {
    return errorHandler.handleError(error, 'Decline Friend Request');
  }
};

module.exports = { handler };
