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
    const { friendUserId } = JSON.parse(event.body || '{}');

    if (!friendUserId) {
      return responseHelpers.error('Friend user ID is required', 400);
    }

    // Can't add yourself as friend
    if (friendUserId === authUser.userId) {
      return responseHelpers.error('Cannot add yourself as a friend', 400);
    }

    // Send friend request
    const friendRequest = await socialHelpers.friends.sendRequest(authUser.userId, friendUserId);

    return responseHelpers.success({
      friendRequest
    }, 'Friend request sent successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Add Friend');
  }
};
module.exports = { handler };
