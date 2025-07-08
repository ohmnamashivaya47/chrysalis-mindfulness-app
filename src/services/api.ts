// CHRYSALIS - Frontend API Service  
// Centralized API communication layer for the meditation app

import type { Friend, FriendRequest, Group } from '../stores/socialStore';

interface User {
  id: string;
  email: string;
  displayName: string;
  profilePicture?: string;
  joinedAt: string;
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
  experience: number;
  lastSessionDate?: string;
  preferences: {
    defaultDuration: number;
    defaultFrequency: string;
    notifications: boolean;
    theme: string;
  };
}

interface Session {
  id: string;
  userId: string;
  duration: number;
  frequency: string;
  completedAt: string;
  xpGained: number;
  sessionType: string;
  actualDuration?: number;
  paused: boolean;
  pauseCount: number;
}

interface SessionData {
  duration: number;
  frequency: string;
  type?: string;
  notes?: string;
  mood_before?: number;
  mood_after?: number;
  focus_rating?: number;
  gratitude_note?: string;
}

interface LeaderboardEntry {
  id: string;
  displayName: string;
  profilePicture?: string;
  totalMinutes: number;
  totalSessions: number;
  currentStreak: number;
  level: number;
  experience: number;
  rank: number;
}

class ChrysalisAPIService {
  private baseUrl = import.meta.env.DEV 
    ? 'http://localhost:3001/api'
    : 'https://chrysalis-backend.onrender.com/api';

  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('chrysalis_auth_token');
  }

  private setAuthToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('chrysalis_auth_token', token);
    } else {
      localStorage.removeItem('chrysalis_auth_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // AUTHENTICATION METHODS

  async register(email: string, password: string, displayName: string): Promise<{
    user: User;
    token: string;
  }> {
    const response = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        display_name: displayName
      }),
    });

    // Store the auth token
    this.setAuthToken(response.token);

    return response;
  }

  async login(email: string, password: string): Promise<{
    user: User;
    token: string;
  }> {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store the auth token
    this.setAuthToken(response.token);

    return response;
  }

  async logout(): Promise<void> {
    // Clear local auth token
    this.setAuthToken(null);
  }

  // USER PROFILE METHODS

  async getProfile(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/users/profile');
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    return this.request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async uploadProfilePicture(file: File): Promise<{ user: User }> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const url = `${this.baseUrl}/users/upload-profile-picture`;
    
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // SESSION METHODS

  async completeSession(sessionData: SessionData): Promise<{
    sessionId: string;
    message: string;
  }> {
    return this.request<{
      sessionId: string;
      message: string;
    }>('/sessions/complete', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  async getSessionHistory(): Promise<{ 
    sessions: Session[]; 
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  }> {
    return this.request<{ 
      sessions: Session[]; 
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }>('/sessions/history');
  }

  async pauseSession(sessionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/sessions/pause', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  async resumeSession(sessionId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/sessions/resume', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    });
  }

  // LEADERBOARD METHODS

  async getGlobalLeaderboard(limit = 50): Promise<{
    leaderboard: LeaderboardEntry[];
    period: string;
    type: string;
  }> {
    return this.request<{
      leaderboard: LeaderboardEntry[];
      period: string;
      type: string;
    }>(`/leaderboards/global?limit=${limit}`);
  }

  async getLocalLeaderboard(limit = 50): Promise<{
    leaderboard: LeaderboardEntry[];
    period: string;
    type: string;
  }> {
    return this.request<{
      leaderboard: LeaderboardEntry[];
      period: string;
      type: string;
    }>(`/leaderboards/local?limit=${limit}`);
  }

  async getFriendsLeaderboard(): Promise<{
    leaderboard: LeaderboardEntry[];
    period: string;
    type: string;
  }> {
    return this.request<{
      leaderboard: LeaderboardEntry[];
      period: string;
      type: string;
    }>('/leaderboards/friends');
  }

  // SOCIAL METHODS - Friends

  async addFriend(friendId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/friends/add', {
      method: 'POST',
      body: JSON.stringify({ friendId }),
    });
  }

  async acceptFriendRequest(requestId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  async getFriends(): Promise<{ friends: Friend[] }> {
    return this.request<{ friends: Friend[] }>('/friends/list');
  }

  async getFriendRequests(): Promise<{
    requests: {
      incoming: FriendRequest[];
      outgoing: FriendRequest[];
    };
  }> {
    return this.request<{
      requests: {
        incoming: FriendRequest[];
        outgoing: FriendRequest[];
      };
    }>('/friends/requests');
  }

  async declineFriendRequest(requestId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/friends/decline', {
      method: 'POST',
      body: JSON.stringify({ requestId }),
    });
  }

  async removeFriend(friendId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/friends/remove', {
      method: 'DELETE',
      body: JSON.stringify({ friendId }),
    });
  }

  async searchUsers(query: string): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>(`/friends/search?query=${encodeURIComponent(query)}`);
  }

  // SOCIAL METHODS - Groups

  async getUserGroups(): Promise<{ groups: Group[] }> {
    return this.request<{ groups: Group[] }>('/groups/list');
  }

  async getPublicGroups(): Promise<{ groups: Group[] }> {
    return this.request<{ groups: Group[] }>('/groups/public');
  }

  async createGroup(groupData: {
    name: string;
    description: string;
    privacy_level?: string;
    max_members?: number;
    meditation_focus?: string;
  }): Promise<{ groupId: string; message: string }> {
    return this.request<{ groupId: string; message: string }>('/groups/create', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  }

  async joinGroup(groupId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/groups/${groupId}/join`, {
      method: 'POST',
    });
  }

  async joinGroupByCode(groupCode: string): Promise<{ 
    message: string; 
    group: { id: string; name: string; description: string; groupCode: string }
  }> {
    return this.request<{ 
      message: string; 
      group: { id: string; name: string; description: string; groupCode: string }
    }>('/groups/join-by-code', {
      method: 'POST',
      body: JSON.stringify({ groupCode }),
    });
  }

  async leaveGroup(groupId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/groups/${groupId}/leave`, {
      method: 'POST',
    });
  }

  async getGroupDetails(groupId: string): Promise<{ group: Group }> {
    return this.request<{ group: Group }>(`/groups/${groupId}/details`);
  }

  async getGroupLeaderboard(groupId: string): Promise<{
    leaderboard: LeaderboardEntry[];
    period: string;
  }> {
    return this.request<{
      leaderboard: LeaderboardEntry[];
      period: string;
    }>(`/groups/${groupId}/leaderboard`);
  }

  // WISDOM QUOTES METHODS

  async getDailyQuote(): Promise<{ quote: { id: string; text: string; author: string; category: string } }> {
    return this.request<{ quote: { id: string; text: string; author: string; category: string } }>('/wisdom/quotes/daily');
  }

  async getRandomQuotes(limit = 1): Promise<{ quotes: { id: string; text: string; author: string; category: string }[] | { id: string; text: string; author: string; category: string } }> {
    return this.request<{ quotes: { id: string; text: string; author: string; category: string }[] | { id: string; text: string; author: string; category: string } }>(`/wisdom/quotes?limit=${limit}`);
  }
}

// Export singleton instance
export const chrysalisAPI = new ChrysalisAPIService();
export const apiService = chrysalisAPI; // Alias for backward compatibility
export default chrysalisAPI;

// Export types
export type { User, Session, SessionData };
