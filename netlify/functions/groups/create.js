import { socialHelpers, initDB } from '../lib/neon-db.js';
import { authUtils, responseHelpers, errorHandler, inputValidation } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
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
const { verifyToken, createResponse } = require('../lib/auth-utils');

exports.handler = async (event, context) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'POST') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyToken(event);
    if (!user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    const { name, description, isPublic } = JSON.parse(event.body);

    // Validate input
    if (!name || name.trim().length < 3) {
      return createResponse(400, { error: 'Group name must be at least 3 characters' });
    }

    if (name.length > 50) {
      return createResponse(400, { error: 'Group name must be less than 50 characters' });
    }

    // Generate unique group code
    const generateGroupCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let groupCode;
    let isCodeUnique = false;
    const existingGroups = await getBlob('groups') || [];

    // Ensure unique code
    while (!isCodeUnique) {
      groupCode = generateGroupCode();
      isCodeUnique = !existingGroups.find(g => g.code === groupCode);
    }

    // Create new group
    const newGroup = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      description: description?.trim() || '',
      code: groupCode,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      memberCount: 1,
      isPublic: Boolean(isPublic)
    };

    // Add group to groups list
    existingGroups.push(newGroup);
    await setBlob('groups', existingGroups);

    // Add creator as first member
    const groupMembers = await getBlob('group_members') || [];
    const membership = {
      id: `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      groupId: newGroup.id,
      userId: user.id,
      joinedAt: new Date().toISOString(),
      role: 'admin'
    };

    groupMembers.push(membership);
    await setBlob('group_members', groupMembers);

    return createResponse(200, {
      message: 'Group created successfully',
      group: {
        ...newGroup,
        role: 'admin',
        memberCount: 1
      }
    });

  } catch (error) {
    console.error('Create group error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
