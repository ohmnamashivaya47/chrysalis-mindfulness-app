// CHRYSALIS - User Profile Management Function
// Get and update user profile information

const { userHelpers, initDB } = require('./lib/neon-db.js');
const { authUtils, responseHelpers, inputValidation, errorHandler } = require('./lib/auth-utils.js');

const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return responseHelpers.cors();
  }

  // Only allow GET and PUT requests
  if (!['GET', 'PUT'].includes(event.httpMethod)) {
    return responseHelpers.error('Method not allowed', 405);
  }

  try {
    // Initialize database
    await initDB();
    
    // Authenticate user
    const authUser = await authUtils.authenticateRequest(event);

    if (event.httpMethod === 'GET') {
      // Get user profile
      const user = await userHelpers.getUserById(authUser.userId);
      if (!user) {
        return responseHelpers.error('User not found', 404);
      }

      const sanitizedUser = authUtils.sanitizeUser(user);
      
      return responseHelpers.success({
        user: sanitizedUser
      }, 'Profile retrieved successfully');

    } else if (event.httpMethod === 'PUT') {
      // Update user profile
      const updateData = JSON.parse(event.body || '{}');
      
      // Validate allowed update fields
      const allowedFields = ['displayName', 'profilePicture', 'preferences'];
      const updateFields = {};
      
      for (const field of allowedFields) {
        if (updateData.hasOwnProperty(field)) {
          updateFields[field] = updateData[field];
        }
      }

      // Validate display name if provided
      if (updateFields.displayName) {
        const nameValidation = inputValidation.displayName(updateFields.displayName);
        if (!nameValidation.valid) {
          return responseHelpers.error(nameValidation.message, 400);
        }
        updateFields.display_name = updateFields.displayName.trim();
        delete updateFields.displayName; // Remove the camelCase version
      }

      // Validate profile picture URL if provided
      if (updateFields.profilePicture) {
        if (typeof updateFields.profilePicture !== 'string') {
          return responseHelpers.error('Profile picture must be a valid URL string', 400);
        }
        // Basic URL validation
        try {
          new URL(updateFields.profilePicture);
        } catch {
          return responseHelpers.error('Profile picture must be a valid URL', 400);
        }
        updateFields.profile_picture = updateFields.profilePicture;
        delete updateFields.profilePicture; // Remove the camelCase version
      }

      // Validate preferences if provided
      if (updateFields.preferences) {
        if (typeof updateFields.preferences !== 'object') {
          return responseHelpers.error('Preferences must be an object', 400);
        }
        
        const validPreferences = ['defaultDuration', 'defaultFrequency', 'notifications', 'theme'];
        const preferences = {};
        
        for (const [key, value] of Object.entries(updateFields.preferences)) {
          if (validPreferences.includes(key)) {
            preferences[key] = value;
          }
        }
        
        updateFields.preferences = preferences;
      }

      // Update user
      const updatedUser = await userHelpers.updateUser(authUser.userId, updateFields);
      const sanitizedUser = authUtils.sanitizeUser(updatedUser);

      return responseHelpers.success({
        user: sanitizedUser
      }, 'Profile updated successfully');
    }

  } catch (error) {
    return errorHandler.handleError(error, 'User Profile');
  }
};
module.exports = { handler };
