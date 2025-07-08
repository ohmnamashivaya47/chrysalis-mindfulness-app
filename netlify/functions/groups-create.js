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
    const { name, description, isPublic } = JSON.parse(event.body || '{}');

    if (!name || name.trim().length < 2) {
      return responseHelpers.error('Group name must be at least 2 characters', 400);
    }

    // Create group
    const group = await socialHelpers.groups.create(authUser.userId, {
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: isPublic || false
    });

    return responseHelpers.success({
      group
    }, 'Group created successfully');
  } catch (error) {
    return errorHandler.handleError(error, 'Create Group');
  }
};

module.exports = { handler };
