import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, QrCode, Copy, Heart, MessageCircle, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSocialStore } from '../../stores/socialStore';
import { apiService } from '../../services/api';

const Friends: React.FC = () => {
  const { user } = useAuthStore();
  const { friends, friendRequests, fetchFriends, fetchFriendRequests } = useSocialStore();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'qr'>('friends');
  const [myFriendCode, setMyFriendCode] = useState('');
  const [scanFriendCode, setScanFriendCode] = useState('');
  const [notification, setNotification] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setMyFriendCode(user.id);
      fetchFriends();
      fetchFriendRequests();
    }
  }, [user, fetchFriends, fetchFriendRequests]);

  const copyFriendCode = async () => {
    try {
      await navigator.clipboard.writeText(myFriendCode);
      setNotification('Friend code copied! Share it to connect.');
      setTimeout(() => setNotification(''), 3000);
    } catch {
      setNotification('Could not copy. Your code: ' + myFriendCode);
      setTimeout(() => setNotification(''), 5000);
    }
  };

  const addFriendByCode = async () => {
    if (!scanFriendCode.trim()) {
      setNotification('Please enter a friend code');
      setTimeout(() => setNotification(''), 3000);
      return;
    }

    setIsLoading(true);
    try {
      // Use the instant friendship endpoint for QR code scanning
      const response = await apiService.addFriendInstant(scanFriendCode.trim());
      setNotification(`Friend added successfully! You are now friends with ${response.friend?.name || 'the user'}.`);
      setScanFriendCode('');
      
      // Refresh friends list
      fetchFriends();
      
      setTimeout(() => setNotification(''), 4000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not add friend. Check the code and try again.';
      setNotification(errorMessage);
      setTimeout(() => setNotification(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const acceptFriendRequest = async (requestId: string) => {
    try {
      await useSocialStore.getState().acceptFriendRequest(requestId);
      setNotification('Friend request accepted!');
      setTimeout(() => setNotification(''), 3000);
    } catch {
      setNotification('Could not accept friend request');
      setTimeout(() => setNotification(''), 3000);
    }
  };

  const generateQRCode = () => {
    // Generate QR code URL
    const qrData = `${window.location.origin}/add-friend/${myFriendCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-[#1B4332] mb-2">
          Mindful Connections
        </h2>
        <p className="text-gray-600">
          Share presence with fellow practitioners
        </p>
      </div>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-center text-sm"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {[
          { id: 'friends', label: 'Friends', icon: Users },
          { id: 'requests', label: 'Requests', icon: Heart },
          { id: 'qr', label: 'Add Friends', icon: QrCode }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as 'friends' | 'requests' | 'qr')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === id
                ? 'bg-white text-[#1B4332] shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'friends' && (
          <motion.div
            key="friends"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-medium text-[#1B4332]">My Friends</h3>
            {friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No friends yet</p>
                <p className="text-sm">Share your QR code to connect!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white font-medium">
                        {friend.name?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{friend.name}</h4>
                        <p className="text-sm text-gray-500">
                          Level {friend.level} • {friend.totalMinutes} minutes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-[#FF8A65] transition-colors">
                        <MessageCircle className="h-4 w-4" />
                      </button>
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'requests' && (
          <motion.div
            key="requests"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-medium text-[#1B4332]">Friend Requests</h3>
            {friendRequests.incoming.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.incoming.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-lg p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                          {request.requesterName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{request.requesterName}</h4>
                          <p className="text-sm text-gray-500">{request.requesterEmail}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => acceptFriendRequest(request.id)}
                          className="px-3 py-1 bg-[#1B4332] text-white rounded-md text-sm hover:bg-[#1B4332]/90 transition-colors"
                        >
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'qr' && (
          <motion.div
            key="qr"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* My QR Code */}
            <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
              <h3 className="text-lg font-medium text-[#1B4332] mb-4">My Friend Code</h3>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <img
                  src={generateQRCode()}
                  alt="My Friend QR Code"
                  className="w-48 h-48 mx-auto mb-4 border border-gray-200 rounded-lg"
                />
                <p className="text-sm text-gray-600 mb-2">Friend Code:</p>
                <p className="font-mono text-sm bg-white px-3 py-1 rounded border">{myFriendCode}</p>
              </div>
              <button
                onClick={copyFriendCode}
                className="flex items-center justify-center space-x-2 w-full bg-[#1B4332] text-white py-2 px-4 rounded-lg hover:bg-[#1B4332]/90 transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Copy Friend Code</span>
              </button>
            </div>

            {/* Add Friend */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-[#1B4332] mb-4">Add a Friend</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Friend Code
                  </label>
                  <input
                    type="text"
                    value={scanFriendCode}
                    onChange={(e) => setScanFriendCode(e.target.value)}
                    placeholder="Paste or type friend code here"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                  />
                </div>
                <button
                  onClick={addFriendByCode}
                  disabled={isLoading || !scanFriendCode.trim()}
                  className="w-full flex items-center justify-center space-x-2 bg-[#FF8A65] text-white py-2 px-4 rounded-lg hover:bg-[#FF8A65]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>{isLoading ? 'Adding...' : 'Add Friend'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Friends;
