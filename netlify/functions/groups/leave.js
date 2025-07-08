import { socialHelpers, initDB } from '../lib/neon-db.js';
import { authUtils, responseHelpers, errorHandler } from '../lib/auth-utils.js';

export const handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') return responseHelpers.cors();
  if (event.httpMethod !== 'POST') return responseHelpers.error('Method not allowed', 405);

  try {
    await initDB();
    const authUser = await authUtils.authenticateRequest(event);
    const { groupId } = JSON.parse(event.body || '{}');
    
    if (!groupId) return responseHelpers.error('Group ID is required', 400);
    
    await socialHelpers.groups.leave(authUser.userId, groupId);
    return responseHelpers.success({}, 'Left group successfully');
  } catch (error) {
    return errorHandler.handleError(error, 'Leave Group');
  }
};
const { verifyToken, createResponse } = require('../lib/auth-utils');

exports.handler = async (event, context) => {
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return createResponse(200, null);
  }

  if (event.httpMethod !== 'DELETE') {
    return createResponse(405, { error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyToken(event);
    if (!user) {
      return createResponse(401, { error: 'Unauthorized' });
    }

    const { groupId } = JSON.parse(event.body);

    if (!groupId) {
      return createResponse(400, { error: 'Group ID is required' });
    }

    // Get group and membership data
    const groups = await getBlob('groups') || [];
    const groupMembers = await getBlob('group_members') || [];

    // Find the group
    const groupIndex = groups.findIndex(g => g.id === groupId);
    if (groupIndex === -1) {
      return createResponse(404, { error: 'Group not found' });
    }

    const group = groups[groupIndex];

    // Check if user is a member
    const membershipIndex = groupMembers.findIndex(m => 
      m.groupId === groupId && m.userId === user.id
    );

    if (membershipIndex === -1) {
      return createResponse(400, { error: 'You are not a member of this group' });
    }

    const membership = groupMembers[membershipIndex];

    // Check if user is the only admin
    if (membership.role === 'admin') {
      const adminCount = groupMembers.filter(m => 
        m.groupId === groupId && m.role === 'admin'
      ).length;

      if (adminCount === 1) {
        // If there are other members, transfer admin role to the next oldest member
        const otherMembers = groupMembers.filter(m => 
          m.groupId === groupId && m.userId !== user.id
        );

        if (otherMembers.length > 0) {
          // Transfer admin to oldest member
          const oldestMemberIndex = groupMembers.findIndex(m => m.id === otherMembers[0].id);
          groupMembers[oldestMemberIndex] = {
            ...groupMembers[oldestMemberIndex],
            role: 'admin'
          };
        } else {
          // Last member leaving - delete the group
          groups.splice(groupIndex, 1);
          await setBlob('groups', groups);
        }
      }
    }

    // Remove the membership
    groupMembers.splice(membershipIndex, 1);
    await setBlob('group_members', groupMembers);

    // Update group member count if group still exists
    if (groups[groupIndex]) {
      groups[groupIndex] = {
        ...groups[groupIndex],
        memberCount: groups[groupIndex].memberCount - 1
      };
      await setBlob('groups', groups);
    }

    return createResponse(200, {
      message: 'Successfully left group',
      groupId
    });

  } catch (error) {
    console.error('Leave group error:', error);
    return createResponse(500, { error: 'Internal server error' });
  }
};
