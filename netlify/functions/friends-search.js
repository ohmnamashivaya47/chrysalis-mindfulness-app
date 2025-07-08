const { socialHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return responseHelpers.cors();
  if (event.httpMethod !== 'GET') return responseHelpers.error('Method not allowed', 405);

  try {
    await initDB();
    const authUser = await authUtils.authenticateRequest(event);
    const { q: query, limit = '20' } = event.queryStringParameters || {};
    
    if (!query) return responseHelpers.error('Query parameter is required', 400);
    
    const results = await socialHelpers.friends.searchUsers(query, authUser.userId, parseInt(limit, 10));
    return responseHelpers.success({ users: results }, 'User search completed');
  } catch (error) {
    return errorHandler.handleError(error, 'Search Users');
  }
};

module.exports = { handler };
