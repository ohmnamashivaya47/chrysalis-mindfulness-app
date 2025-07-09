import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, QrCode, Copy, Heart, MessageCircle, UserCheck } from 'lucide-react';
import { apiService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore, type Friend as StoreFriend, type FriendRequest as StoreFriendRequest } from '../../stores/socialStore';

interface Friend {
  id: string;
  displayName: string;
  profilePicture?: string;
  totalMinutes: number;
  totalSessions: number;
  level: number;
  lastActive: string;
  isOnline: boolean;
}

interface FriendRequest {
  id: string;
  fromUser: {
    id: string;
    displayName: string;
    profilePicture?: string;
    level: number;
  };
  toUser: {
    id: string;
    displayName: string;
  };
  createdAt: string;
  status: 'pending' | 'accepted' | 'declined';
}

const Friends: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'qr'>('friends');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
  const [friendCode, setFriendCode] = useState('');
  const [showQRModal, setShowQRModal] = useState(false);
  const [notification, setNotification] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null); // NEW: success feedback
  const liveRegionRef = React.useRef<HTMLDivElement>(null); // NEW: for ARIA live region

  const { 
    friends: storeFriends, 
    friendRequests: storeRequests, 
    fetchFriends, 
    fetchFriendRequests,
    acceptFriendRequest,
    addFriend
  } = useSocialStore();

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      // Try to load friends data, but don't crash if it fails
      try {
        await fetchFriends();
      } catch (friendsError) {
        console.log('Friends list not available yet:', friendsError);
      }
      
      try {
        await fetchFriendRequests();
      } catch (requestsError) {
        console.log('Friend requests not available yet:', requestsError);
      }
      
      // Map store data to component interfaces
      const mappedFriends: Friend[] = (storeFriends || []).map((friend: StoreFriend) => ({
        id: friend.id,
        displayName: friend.name,
        profilePicture: friend.profilePicture,
        totalMinutes: friend.totalMinutes,
        totalSessions: friend.totalSessions,
        level: friend.level,
        lastActive: friend.friendshipCreatedAt,
        isOnline: false // Default value
      }));
      const mappedIncoming: FriendRequest[] = (storeRequests?.incoming || []).map((req: StoreFriendRequest) => ({
        id: req.id,
        fromUser: {
          id: req.requesterUserId,
          displayName: req.requesterName,
          profilePicture: req.requesterProfilePicture,
          level: 1 // Default value
        },
        toUser: {
          id: '', // Current user
          displayName: ''
        },
        createdAt: req.createdAt,
        status: 'pending' as const
      }));
      const mappedOutgoing: FriendRequest[] = (storeRequests?.outgoing || []).map((req: StoreFriendRequest) => ({
        id: req.id,
        fromUser: {
          id: '', // Current user
          displayName: '',
          level: 1
        },
        toUser: {
          id: req.requesterUserId,
          displayName: req.requesterName
        },
        createdAt: req.createdAt,
        status: 'pending' as const
      }));
      setFriends(mappedFriends);
      setIncomingRequests(mappedIncoming);
      setOutgoingRequests(mappedOutgoing);
    } catch {
      // Show a friendly message but don't prevent the page from working
      console.log('Friends feature is still loading. This is normal for new accounts.');
      setError(null); // Don't show error - just keep page working
      // Set empty arrays as fallback
      setFriends([]);
      setIncomingRequests([]);
      setOutgoingRequests([]);
    } finally {
      setLoading(false);
    }
  }, [fetchFriends, fetchFriendRequests, storeFriends, storeRequests]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    if ((error || success) && liveRegionRef.current) {
      liveRegionRef.current.focus();
    }
  }, [error, success]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiService.searchUsers(query);
      // Map User[] to SearchResult[]
      const mappedResults: SearchResult[] = response.users.map((user) => ({
        id: user.id,
        displayName: user.displayName,
        profilePicture: user.profilePicture,
        level: user.level,
        totalSessions: user.totalSessions,
        isFriend: friends.some(f => f.id === user.id),
        hasPendingRequest: incomingRequests.some(r => r.fromUser.id === user.id) || outgoingRequests.some(r => r.toUser.id === user.id)
      }));
      setSearchResults(mappedResults);
    } catch {
      setError('Search temporarily unavailable. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await addFriend(userId);
      setSearchResults(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, hasPendingRequest: true }
            : user
        )
      );
      setSuccess('Friend request sent!\n\u2014 Every connection is a step toward community.');
    } catch {
      setError('Unable to send friend request. Please try again.\n\u2014 You are still whole, with or without response.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await acceptFriendRequest(requestId);
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      await fetchFriends(); // Refresh friends list
      setSuccess('Friend request accepted!\n\u2014 May your journey together be mindful and kind.');
    } catch {
      setError('Unable to accept request. Please try again.\n\u2014 Compassion includes yourself.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiService.declineFriendRequest(requestId);
      setIncomingRequests(prev => prev.filter(req => req.id !== requestId));
      setSuccess('Request declined.\n\u2014 Boundaries are an act of self-care.');
    } catch {
      setError('Unable to decline request. Please try again.\n\u2014 You are still worthy of connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!window.confirm('Are you sure you want to remove this friend? This action cannot be undone.')) {
      return;
    }
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await apiService.removeFriend(friendId);
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
      setSuccess('Friend removed.\n\u2014 Sometimes letting go is the most mindful act.');
    } catch {
      setError('Unable to remove friend. Please try again.\n\u2014 You are still surrounded by presence.');
    } finally {
      setLoading(false);
    }
  };

  const formatLastActive = (lastActive: string) => {
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffInHours = Math.floor((now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const tabVariants = {
    inactive: { opacity: 0.6, scale: 0.95 },
    active: { opacity: 1, scale: 1 }
  };

  const contentVariants = {
    enter: { opacity: 0, y: 20 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  if (loading && friends.length === 0) {
    return (
      <div className="min-h-screen bg-[#F7F3E9] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-[#1B4332] border-t-transparent rounded-full"
        />
        <span className="ml-3 text-[#1B4332] font-medium">Loading your connections...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F3E9] text-[#1B4332]">
      {/* Daily Wisdom Quote */}
      <div className="mb-6 text-center">
        <blockquote className="italic text-primary-700 text-lg max-w-xl mx-auto">
          "We are here to awaken from the illusion of our separateness."
          <br />
          <span className="block mt-2 text-primary-500 text-sm">– Thich Nhat Hanh</span>
        </blockquote>
      </div>

      {/* Header */}
      <div className="bg-white border-b border-[#1B4332]/10">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-[#1B4332]" />
              <div>
                <h1 className="text-3xl font-bold text-[#1B4332]">Sacred Connections</h1>
                <p className="text-[#1B4332]/70 mt-1">Share the journey with kindred spirits</p>
              </div>
            </div>
            <div className="text-right text-sm text-[#1B4332]/70">
              <div>{friends.length} friends</div>
              <div>{incomingRequests.length} pending requests</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#1B4332]/10">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex space-x-8">
            {[
              { id: 'friends', label: 'My Friends', count: friends.length },
              { id: 'requests', label: 'Requests', count: incomingRequests.length },
              { id: 'search', label: 'Find Friends', count: null }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`relative py-4 px-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#1B4332] border-b-2 border-[#1B4332]'
                    : 'text-[#1B4332]/60 hover:text-[#1B4332]/80'
                }`}
                variants={tabVariants}
                animate={activeTab === tab.id ? 'active' : 'inactive'}
              >
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-2 bg-[#FF8A65] text-white text-xs px-2 py-1 rounded-full"
                  >
                    {tab.count}
                  </motion.span>
                )}
              </motion.button>
            ))}
          </nav>
        </div>
      </div>

      {/* Error/Success Message with ARIA live region */}
      <div
        ref={liveRegionRef}
        tabIndex={-1}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {error || success}
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-[#FF8A65] text-white px-4 py-3 text-center"
          >
            <div className="max-w-4xl mx-auto">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-4 text-white/80 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-600 text-white px-4 py-3 text-center"
          >
            <div className="max-w-4xl mx-auto">
              {success}
              <button
                onClick={() => setSuccess(null)}
                className="ml-4 text-white/80 hover:text-white"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {/* Friends Tab */}
            {activeTab === 'friends' && (
              <div className="space-y-6">
                {friends.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-[#1B4332]/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1B4332] mb-2">
                      Your Circle Awaits
                    </h3>
                    <p className="text-[#1B4332]/70 mb-6">
                      Connect with fellow practitioners to share the journey of mindfulness together.<br />
                      <span className="italic text-primary-500">“The journey doesn’t end here. Each day is a new beginning.”</span>
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('search')}
                      className="bg-[#1B4332] text-white px-6 py-3 rounded-full font-medium"
                    >
                      Find Friends
                    </motion.button>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 border border-[#1B4332]/10 hover:border-[#1B4332]/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-[#1B4332]/10 rounded-full flex items-center justify-center">
                                {friend.profilePicture ? (
                                  <img
                                    src={friend.profilePicture}
                                    alt={friend.displayName}
                                    className="w-12 h-12 rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[#1B4332] font-semibold text-lg">
                                    {friend.displayName.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              {friend.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-[#1B4332]">{friend.displayName}</h3>
                              <div className="flex items-center space-x-4 text-sm text-[#1B4332]/70">
                                <span>Level {friend.level}</span>
                                <span>•</span>
                                <span>{friend.totalSessions} sessions</span>
                                <span>•</span>
                                <span>{Math.round(friend.totalMinutes)} min</span>
                              </div>
                              <div className="text-xs text-[#1B4332]/50 mt-1">
                                {formatLastActive(friend.lastActive)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="p-2 text-[#1B4332]/60 hover:text-[#1B4332] hover:bg-[#1B4332]/5 rounded-full transition-colors"
                            >
                              <MessageCircle className="w-5 h-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleRemoveFriend(friend.id)}
                              className="p-2 text-[#FF8A65]/60 hover:text-[#FF8A65] hover:bg-[#FF8A65]/5 rounded-full transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Requests Tab */}
            {activeTab === 'requests' && (
              <div className="space-y-6">
                {incomingRequests.length === 0 && outgoingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus className="w-16 h-16 text-[#1B4332]/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1B4332] mb-2">
                      No Pending Requests
                    </h3>
                    <p className="text-[#1B4332]/70">
                      When someone sends you a friend request, it will appear here.<br />
                      <span className="italic text-primary-500">“Patience is also a form of action.”</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Incoming Requests */}
                    {incomingRequests.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#1B4332] mb-4">
                          Incoming Requests ({incomingRequests.length})
                        </h3>
                        <div className="grid gap-4">
                          {incomingRequests.map((request) => (
                            <motion.div
                              key={request.id}
                              layout
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white rounded-2xl p-6 border border-[#1B4332]/10"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-[#1B4332]/10 rounded-full flex items-center justify-center">
                                    {request.fromUser.profilePicture ? (
                                      <img
                                        src={request.fromUser.profilePicture}
                                        alt={request.fromUser.displayName}
                                        className="w-12 h-12 rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-[#1B4332] font-semibold text-lg">
                                        {request.fromUser.displayName.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-[#1B4332]">
                                      {request.fromUser.displayName}
                                    </h4>
                                    <p className="text-sm text-[#1B4332]/70">
                                      Level {request.fromUser.level} • Wants to connect
                                    </p>
                                    <p className="text-xs text-[#1B4332]/50 mt-1">
                                      {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleAcceptRequest(request.id)}
                                    className="bg-[#1B4332] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Accept</span>
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeclineRequest(request.id)}
                                    className="bg-[#1B4332]/10 text-[#1B4332] px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Decline</span>
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Outgoing Requests */}
                    {outgoingRequests.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-[#1B4332] mb-4">
                          Sent Requests ({outgoingRequests.length})
                        </h3>
                        <div className="grid gap-4">
                          {outgoingRequests.map((request) => (
                            <motion.div
                              key={request.id}
                              layout
                              initial={{ opacity: 0, x: 20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white rounded-2xl p-6 border border-[#1B4332]/10 opacity-60"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-[#1B4332]/10 rounded-full flex items-center justify-center">
                                    <span className="text-[#1B4332] font-semibold text-lg">
                                      {request.toUser.displayName.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-[#1B4332]">
                                      {request.toUser.displayName}
                                    </h4>
                                    <p className="text-sm text-[#1B4332]/70">Request pending</p>
                                    <p className="text-xs text-[#1B4332]/50 mt-1">
                                      Sent {new Date(request.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-sm text-[#1B4332]/50 font-medium">
                                  Awaiting response
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Search Tab */}
            {activeTab === 'search' && (
              <div className="space-y-6">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#1B4332]/40 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-[#1B4332]/20 rounded-2xl focus:outline-none focus:border-[#1B4332] transition-colors text-[#1B4332] placeholder-[#1B4332]/50"
                  />
                </div>

                {/* Search Results */}
                {searchQuery.trim() === '' ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-[#1B4332]/30 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-[#1B4332] mb-2">
                      Discover Mindful Companions
                    </h3>
                    <p className="text-[#1B4332]/70">
                      Search for friends by name or email to start building your mindfulness community.<br />
                      <span className="italic text-primary-500">“A single conversation across the table with a wise person is worth a month’s study of books.”</span>
                    </p>
                  </div>
                ) : searchResults.length === 0 && !loading ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-[#1B4332]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-[#1B4332]/40" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#1B4332] mb-2">
                      No Results Found
                    </h3>
                    <p className="text-[#1B4332]/70">
                      Try a different search term or invite your friends to join CHRYSALIS.<br />
                      <span className="italic text-primary-500">“Sometimes those who wander are searching for connection.”</span>
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {searchResults.map((user) => (
                      <motion.div
                        key={user.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-6 border border-[#1B4332]/10 hover:border-[#1B4332]/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-[#1B4332]/10 rounded-full flex items-center justify-center">
                              {user.profilePicture ? (
                                <img
                                  src={user.profilePicture}
                                  alt={user.displayName}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-[#1B4332] font-semibold text-lg">
                                  {user.displayName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold text-[#1B4332]">{user.displayName}</h4>
                              <div className="flex items-center space-x-4 text-sm text-[#1B4332]/70">
                                <span>Level {user.level}</span>
                                <span>•</span>
                                <span>{user.totalSessions} sessions</span>
                              </div>
                            </div>
                          </div>
                          <div>
                            {user.isFriend ? (
                              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                                Friends
                              </div>
                            ) : user.hasPendingRequest ? (
                              <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                                Request Sent
                              </div>
                            ) : (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleSendFriendRequest(user.id)}
                                className="bg-[#1B4332] text-white px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2"
                              >
                                <UserPlus className="w-4 h-4" />
                                <span>Add Friend</span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Friends;
