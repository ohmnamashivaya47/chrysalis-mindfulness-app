// CHRYSALIS - Social Store
// Zustand store for managing friends, groups, and social features

import { create } from 'zustand';
import { apiService } from '../services/api';

interface Friend {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  level: number;
  xp: number;
  totalSessions: number;
  totalMinutes: number;
  friendshipCreatedAt: string;
}

interface FriendRequest {
  id: string;
  requesterUserId: string;
  requesterName: string;
  requesterEmail: string;
  requesterProfilePicture?: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  code: string;
  createdBy: string;
  createdAt: string;
  memberCount: number;
  isPublic: boolean;
  role: 'member' | 'admin';
  joinedAt: string;
  creatorName?: string;
  recentActivity: number;
}

interface SocialState {
  // Friends
  friends: Friend[];
  friendRequests: {
    incoming: FriendRequest[];
    outgoing: FriendRequest[];
  };
  
  // Groups
  groups: Group[];
  
  // Loading states
  isLoadingFriends: boolean;
  isLoadingRequests: boolean;
  isLoadingGroups: boolean;
  
  // Actions
  fetchFriends: () => Promise<void>;
  fetchFriendRequests: () => Promise<void>;
  addFriend: (friendUserId: string) => Promise<void>;
  addFriendInstant: (friendCode: string) => Promise<{ 
    message: string; 
    friend?: { id: string; name: string; email: string }; 
  }>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, description: string, isPublic?: boolean) => Promise<{ id: string; code: string }>;
  joinGroup: (groupCode: string) => Promise<void>;
  getPublicGroups: () => Promise<Group[]>;
  getUserGroups: () => Promise<Group[]>;
  leaveGroup: (groupId: string) => Promise<void>;
  
  // Reset
  reset: () => void;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  // Initial state
  friends: [],
  friendRequests: {
    incoming: [],
    outgoing: [],
  },
  groups: [],
  isLoadingFriends: false,
  isLoadingRequests: false,
  isLoadingGroups: false,

  // Fetch friends
  fetchFriends: async () => {
    set({ isLoadingFriends: true });
    try {
      const response = await apiService.getFriends();
      set({ 
        friends: response.friends || [],
        isLoadingFriends: false 
      });
    } catch (error) {
      console.error('Failed to fetch friends:', error);
      set({ 
        friends: [], // Fallback to empty array
        isLoadingFriends: false 
      });
    }
  },

  // Fetch friend requests
  fetchFriendRequests: async () => {
    set({ isLoadingRequests: true });
    try {
      const response = await apiService.getFriendRequests();
      set({ 
        friendRequests: {
          incoming: response.requests?.incoming || [],
          outgoing: response.requests?.outgoing || [],
        },
        isLoadingRequests: false 
      });
    } catch (error) {
      console.error('Failed to fetch friend requests:', error);
      set({ 
        friendRequests: {
          incoming: [],
          outgoing: [],
        },
        isLoadingRequests: false 
      });
    }
  },

  // Add friend
  addFriend: async (friendUserId: string) => {
    try {
      await apiService.addFriend(friendUserId);
      // Refresh friend requests to show the new outgoing request
      get().fetchFriendRequests();
    } catch (error) {
      console.error('Failed to add friend:', error);
      throw error;
    }
  },

  // Add friend instantly via QR code
  addFriendInstant: async (friendCode: string) => {
    try {
      const response = await apiService.addFriendInstant(friendCode);
      // Refresh friends list since friendship is instant
      get().fetchFriends();
      return response;
    } catch (error) {
      console.error('Failed to add friend instantly:', error);
      throw error;
    }
  },

  // Accept friend request
  acceptFriendRequest: async (requestId: string) => {
    try {
      await apiService.acceptFriendRequest(requestId);
      // Refresh both friends and requests
      get().fetchFriends();
      get().fetchFriendRequests();
    } catch (error) {
      console.error('Failed to accept friend request:', error);
      throw error;
    }
  },

  // Fetch groups
  fetchGroups: async () => {
    set({ isLoadingGroups: true });
    try {
      const response = await apiService.getUserGroups();
      set({ 
        groups: response.groups,
        isLoadingGroups: false 
      });
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      set({ isLoadingGroups: false });
    }
  },

  // Create group
  createGroup: async (name: string, description: string, isPublic = false) => {
    try {
      const response = await apiService.createGroup({
        name,
        description,
        isPublic // Use the new field name that matches the frontend
      });
      // Refresh groups list
      get().fetchGroups();
      return { 
        id: response.groupId, 
        code: response.code || '' // Return the group code from backend
      };
    } catch (error) {
      console.error('Failed to create group:', error);
      throw error;
    }
  },

  // Join group
  joinGroup: async (groupCode: string) => {
    try {
      await apiService.joinGroupByCode(groupCode);
      // Refresh groups list to get updated user groups
      get().fetchGroups();
    } catch (error) {
      console.error('Failed to join group:', error);
      throw error;
    }
  },

  // Get public groups
  getPublicGroups: async () => {
    try {
      const response = await apiService.getPublicGroups();
      return response.groups.filter((group: Group) => group.isPublic);
    } catch (error) {
      console.error('Failed to get public groups:', error);
      return [];
    }
  },

  // Get user groups
  getUserGroups: async () => {
    try {
      const response = await apiService.getUserGroups();
      return response.groups;
    } catch (error) {
      console.error('Failed to get user groups:', error);
      return [];
    }
  },

  // Leave group
  leaveGroup: async (groupId: string) => {
    try {
      await apiService.leaveGroup(groupId);
      // Refresh groups list
      get().fetchGroups();
    } catch (error) {
      console.error('Failed to leave group:', error);
      throw error;
    }
  },

  // Reset store
  reset: () => {
    set({
      friends: [],
      friendRequests: { incoming: [], outgoing: [] },
      groups: [],
      isLoadingFriends: false,
      isLoadingRequests: false,
      isLoadingGroups: false,
    });
  },
}));

// Export types
export type { Friend, FriendRequest, Group };
