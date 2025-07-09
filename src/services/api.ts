// CHRYSALIS - Frontend API Service  
// Centralized API communication layer for the meditation app

import type { Friend, FriendRequest, Group } from '../stores/socialStore';

// Backend user interface (snake_case fields)
interface BackendUser {
  id: string;
  email: string;
  display_name: string;
  profile_picture?: string;
  joined_at: string;
  total_sessions: number;
  total_minutes: number;
  current_streak: number;
  longest_streak: number;
  level: number;
  experience: number;
  last_session_date?: string;
  preferences: {
    defaultDuration?: number;
    defaultFrequency?: string;
    notifications?: boolean;
    theme?: string;
  } | Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Frontend user interface (camelCase fields)
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
    : 'https://chrysalis-mindfulness-app.onrender.com/api';

  private token: string | null = null;

  constructor() {
    // Load token from localStorage on initialization
    this.token = localStorage.getItem('chrysalis_auth_token');
  }

  // Helper function to map backend user to frontend user interface
  private mapBackendUser(backendUser: BackendUser): User {
    return {
      id: backendUser.id,
      email: backendUser.email,
      displayName: backendUser.display_name,
      profilePicture: backendUser.profile_picture,
      joinedAt: backendUser.joined_at,
      totalSessions: backendUser.total_sessions || 0,
      totalMinutes: backendUser.total_minutes || 0,
      currentStreak: backendUser.current_streak || 0,
      longestStreak: backendUser.longest_streak || 0,
      level: backendUser.level || 1,
      experience: backendUser.experience || 0,
      lastSessionDate: backendUser.last_session_date,
      preferences: {
        defaultDuration: (backendUser.preferences as Record<string, unknown>)?.defaultDuration as number || 10,
        defaultFrequency: (backendUser.preferences as Record<string, unknown>)?.defaultFrequency as string || 'daily',
        notifications: (backendUser.preferences as Record<string, unknown>)?.notifications as boolean ?? true,
        theme: (backendUser.preferences as Record<string, unknown>)?.theme as string || 'light'
      }
    };
  }

  // Helper function to map backend leaderboard entry to frontend format
  private mapLeaderboardEntry(backendEntry: Record<string, unknown>): LeaderboardEntry {
    return {
      id: backendEntry.id as string,
      displayName: (backendEntry.display_name as string) || 'Unknown User',
      profilePicture: backendEntry.profile_picture as string,
      totalMinutes: (backendEntry.total_minutes as number) || 0,
      totalSessions: (backendEntry.total_sessions as number) || 0,
      currentStreak: (backendEntry.current_streak as number) || 0,
      level: (backendEntry.level as number) || 1,
      experience: (backendEntry.experience as number) || 0,
      rank: (backendEntry.rank as number) || 0
    };
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
      ...(options.headers as Record<string, string> || {}),
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
      // Add longer timeout for mobile networks
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } else {
            // Server returned HTML or other non-JSON response
            const textResponse = await response.text();
            console.error(`API Error - Non-JSON response from ${endpoint}:`, textResponse.substring(0, 200));
            
            if (textResponse.includes('<!DOCTYPE html>')) {
              errorMessage = 'Server error - received HTML instead of JSON. Please check your internet connection and try again.';
            } else {
              errorMessage = `Server error (${response.status}). Please try again.`;
            }
          }
        } catch (parseError) {
          console.error(`API Error - Could not parse error response from ${endpoint}:`, parseError);
          errorMessage = `Network error (${response.status}). Please check your connection and try again.`;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error(`API Error - Invalid content-type from ${endpoint}:`, contentType);
          console.error('Response text:', textResponse.substring(0, 200));
          
          if (textResponse.includes('<!DOCTYPE html>')) {
            throw new Error('Server returned HTML page instead of JSON. Please check your internet connection.');
          } else {
            throw new Error('Server returned invalid response format. Please try again.');
          }
        }
        
        data = await response.json();
      } catch (jsonError) {
        console.error(`API Error - Invalid JSON response from ${endpoint}:`, jsonError);
        const textResponse = await response.text();
        console.error('Response text:', textResponse.substring(0, 200));
        throw new Error('Server returned invalid JSON response. Please check your connection and try again.');
      }
      
      if (!data.success) {
        throw new Error(data.error || data.message || 'API request failed');
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.error(`API Timeout (${endpoint}):`, error);
          throw new Error('Request timed out. Please check your internet connection and try again.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          console.error(`API Network Error (${endpoint}):`, error);
          throw new Error('Network error. Please check your internet connection and try again.');
        } else {
          console.error(`API Error (${endpoint}):`, error);
          throw error;
        }
      } else {
        console.error(`API Unknown Error (${endpoint}):`, error);
        throw new Error('An unexpected error occurred. Please try again.');
      }
    }
  }

  // AUTHENTICATION METHODS

  async register(email: string, password: string, displayName: string): Promise<{
    user: User;
    token: string;
  }> {
    const response = await this.request<{ user: BackendUser; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password, 
        display_name: displayName
      }),
    });

    // Store the auth token
    this.setAuthToken(response.token);

    return {
      user: this.mapBackendUser(response.user),
      token: response.token
    };
  }

  async login(email: string, password: string): Promise<{
    user: User;
    token: string;
  }> {
    const response = await this.request<{ user: BackendUser; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store the auth token
    this.setAuthToken(response.token);

    return {
      user: this.mapBackendUser(response.user),
      token: response.token
    };
  }

  async logout(): Promise<void> {
    // Clear local auth token
    this.setAuthToken(null);
  }

  // USER PROFILE METHODS

  async getProfile(): Promise<{ user: User }> {
    const response = await this.request<{ user: BackendUser }>('/users/profile');
    return { user: this.mapBackendUser(response.user) };
  }

  async updateProfile(updates: Partial<User>): Promise<{ user: User }> {
    // Map frontend field names to backend field names
    const backendUpdates: Record<string, unknown> = {};
    if (updates.displayName !== undefined) backendUpdates.displayName = updates.displayName;
    if (updates.profilePicture !== undefined) backendUpdates.profilePicture = updates.profilePicture;
    
    const response = await this.request<{ user: BackendUser }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(backendUpdates),
    });

    return { user: this.mapBackendUser(response.user) };
  }

  async uploadProfilePicture(file: File): Promise<{ user: User }> {
    const formData = new FormData();
    formData.append('image', file); // Backend expects 'image' field

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

    const data = await response.json() as { user: BackendUser };
    
    return { user: this.mapBackendUser(data.user) };
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
    const response = await this.request<{
      leaderboard: Record<string, unknown>[];
      period: string;
      type: string;
    }>(`/leaderboards/global?limit=${limit}`);
    
    return {
      leaderboard: response.leaderboard.map(entry => this.mapLeaderboardEntry(entry)),
      period: response.period,
      type: response.type
    };
  }

  async getLocalLeaderboard(limit = 50): Promise<{
    leaderboard: LeaderboardEntry[];
    period: string;
    type: string;
  }> {
    const response = await this.request<{
      leaderboard: Record<string, unknown>[];
      period: string;
      type: string;
    }>(`/leaderboards/local?limit=${limit}`);
    
    return {
      leaderboard: response.leaderboard.map(entry => this.mapLeaderboardEntry(entry)),
      period: response.period,
      type: response.type
    };
  }

  async getFriendsLeaderboard(): Promise<{
    leaderboard: LeaderboardEntry[];
    period: string;
    type: string;
  }> {
    const response = await this.request<{
      leaderboard: Record<string, unknown>[];
      period: string;
      type: string;
    }>('/leaderboards/friends');
    
    return {
      leaderboard: response.leaderboard.map(entry => this.mapLeaderboardEntry(entry)),
      period: response.period,
      type: response.type
    };
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
    const response = await this.request<{ users: BackendUser[] }>(`/friends/search?query=${encodeURIComponent(query)}`);
    
    // Map backend users to frontend users
    const mappedUsers = response.users.map(user => this.mapBackendUser(user));
    
    return { users: mappedUsers };
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
    isPublic?: boolean;
    privacy_level?: string;
    max_members?: number;
    meditation_focus?: string;
  }): Promise<{ groupId: string; code: string; message: string }> {
    return this.request<{ groupId: string; code: string; message: string }>('/groups/create', {
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
