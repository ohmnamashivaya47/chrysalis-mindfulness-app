// CHRYSALIS - Session Completion Function
// Records completed meditation sessions and updates user stats

const { userHelpers, sessionHelpers } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, inputValidation, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    // Parse request body
    const sessionData = JSON.parse(event.body || '{}');

    // Validate session data
    const validation = inputValidation.sessionData(sessionData);
    if (!validation.valid) {
      return responseHelpers.error('Invalid session data', 400, validation.messages);
    }

    // Create session record
    const session = await sessionHelpers.createSession(authUser.userId, {
      duration: sessionData.duration,
      frequency: sessionData.frequency,
      type: sessionData.type || 'meditation',
      actualDuration: sessionData.actualDuration || sessionData.duration,
      paused: sessionData.paused || false,
      pauseCount: sessionData.pauseCount || 0
    });

    // Update user stats
    const statsUpdate = await userHelpers.updateUserStats(authUser.userId, {
      duration: sessionData.duration
    });

    // Return success response with updated user data and session info
    return responseHelpers.success({
      session,
      user: authUtils.sanitizeUser(statsUpdate.user),
      xpGained: statsUpdate.xpGained,
      levelUp: statsUpdate.user.level > (statsUpdate.user.level - Math.floor(statsUpdate.xpGained / 100))
    }, 'Session completed successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Session Completion');
  }
};
module.exports = { handler };
