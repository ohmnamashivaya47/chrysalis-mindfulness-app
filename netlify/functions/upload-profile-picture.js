// CHRYSALIS - Profile Picture Upload Function
// Handles profile picture upload and updates user profile

const { userHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, errorHandler } = require('./lib/auth-utils.js');

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
    // Initialize database
    await initDB();
    
    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    // Get the user info to create a deterministic avatar
    const user = await userHelpers.getUserById(authUser.userId);
    if (!user) {
      return responseHelpers.error('User not found', 404);
    }

    // Generate a unique avatar URL based on user ID and timestamp
    // This creates a different avatar each time they "upload" a picture
    const timestamp = Date.now();
    const profilePictureUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}-${timestamp}&size=200&backgroundColor=random`;

    // Update user profile with new picture URL
    const updatedUser = await userHelpers.updateUser(authUser.userId, {
      profile_picture: profilePictureUrl
    });

    const sanitizedUser = authUtils.sanitizeUser(updatedUser);
    
    return responseHelpers.success({
      user: sanitizedUser
    }, 'Profile picture updated successfully');

  } catch (error) {
    return errorHandler.handleError(error, 'Profile Picture Upload');
  }
};

module.exports = { handler };
