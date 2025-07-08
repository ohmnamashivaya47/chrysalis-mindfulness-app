import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, Plus, Search, Crown } from 'lucide-react'
import { useSocialStore } from '../../stores/socialStore'
import { Button } from '../ui'
import { QRCodeSVG } from 'qrcode.react';
import { Html5Qrcode } from 'html5-qrcode';

interface Group {
  id: string
  name: string
  description: string
  memberCount: number
  isPublic: boolean
  groupCode?: string
  createdAt: string
  createdBy: string
  userRole?: 'admin' | 'member'
  isMember?: boolean
}

export const Groups = () => {
  const [groups, setGroups] = useState<Group[]>([])
  const [myGroups, setMyGroups] = useState<Group[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDescription, setNewGroupDescription] = useState('')
  const [newGroupIsPublic, setNewGroupIsPublic] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [createdGroupCode, setCreatedGroupCode] = useState<string | null>(null)
  const [showQRModal, setShowQRModal] = useState<string | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [autoJoinCode, setAutoJoinCode] = useState<string | null>(null); // For universal join

  const { 
    getPublicGroups, 
    getUserGroups, 
    createGroup, 
    joinGroup, 
    leaveGroup 
  } = useSocialStore()

  const loadGroups = useCallback(async () => {
    setLoading(true)
    try {
      // Try to load groups data, but don't crash if it fails
      try {
        const publicGroups = await getPublicGroups()
        setGroups(publicGroups)
      } catch (groupsError) {
        console.log('Public groups not available yet:', groupsError)
        setGroups([]) // Set empty array as fallback
      }
      
      try {
        const userGroups = await getUserGroups()
        setMyGroups(userGroups)
      } catch (userGroupsError) {
        console.log('User groups not available yet:', userGroupsError)
        setMyGroups([]) // Set empty array as fallback
      }
    } catch {
      console.log('Groups feature is still loading. This is normal for new accounts.')
    }
    setLoading(false)
  }, [getPublicGroups, getUserGroups])

  useEffect(() => {
    loadGroups()
  }, [loadGroups])

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    setFeedback(null)
    try {
      const result = await createGroup(
        newGroupName.trim(),
        newGroupDescription.trim() || 'A mindful group for meditation practice.', // Optional description with fallback
        newGroupIsPublic
      )
      setCreatedGroupCode(result.code || null)
      setNewGroupName('')
      setNewGroupDescription('')
      setNewGroupIsPublic(true) // Reset to default
      setShowCreateModal(false)
      
      // Automatically show QR code after group creation
      if (result.code) {
        setShowQRModal(result.code)
      }
      
      setFeedback('Group created! Your group code QR is now displayed - share it to invite others.')
      loadGroups()
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFeedback(error.message)
      } else {
        setFeedback('Error creating group')
      }
      console.error('Error creating group:', error)
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setFeedback(null)
    try {
      await joinGroup(joinCode.trim())
      setJoinCode('')
      setShowJoinModal(false)
      setFeedback('Joined group successfully!')
      loadGroups()
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFeedback(error.message)
      } else {
        setFeedback('Error joining group')
      }
      console.error('Error joining group:', error)
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await leaveGroup(groupId)
      loadGroups()
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  // Add useEffect to handle QR scan
  useEffect(() => {
    if (showScanModal) {
      const qr = new Html5Qrcode('qr-reader');
      qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 200 },
        async (decodedText) => {
          setShowScanModal(false);
          setJoinCode(decodedText);
          try {
            await joinGroup(decodedText);
            setFeedback('Joined group successfully!');
            loadGroups();
          } catch {
            setFeedback('Error joining group');
          }
          qr.stop();
        },
        (/* err */) => {
          // Optionally handle scan errors
        }
      );
      return () => {
        qr.stop().catch(() => {});
      };
    }
  }, [showScanModal, joinGroup, loadGroups]);

  // Universal join: check for ?code= in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setAutoJoinCode(code);
      setShowJoinModal(true);
      setJoinCode(code);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // After auth: if pendingJoinCode, auto-join
  useEffect(() => {
    if (autoJoinCode) {
      (async () => {
        try {
          await joinGroup(autoJoinCode);
          setFeedback('Joined group successfully!\n\u2014 You are now part of a mindful community.');
          setAutoJoinCode(null);
          loadGroups();
        } catch {
          setFeedback('Error joining group.\n\u2014 The path to connection is sometimes winding.');
        }
      })();
    }
  }, [autoJoinCode, joinGroup, loadGroups]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-forest-900">Groups</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowJoinModal(true)}
            variant="secondary"
            size="sm"
          >
            <Search className="w-4 h-4 mr-2" />
            Join Group
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Group
          </Button>
        </div>
      </div>

      {/* Daily Wisdom Quote */}
      <div className="mb-6 text-center">
        <blockquote className="italic text-primary-700 text-lg max-w-xl mx-auto">
          "When you plant a seed of kindness, you grow a garden of connection."
          <br />
          <span className="block mt-2 text-primary-500 text-sm">– Jack Kornfield</span>
        </blockquote>
      </div>

      {/* Feedback Message with ARIA live region */}
      <div
        tabIndex={-1}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {feedback}
      </div>
      <div className="max-w-md mx-auto mb-4">
        {feedback && (
          <div className="bg-coral-100 text-coral-800 rounded-lg px-4 py-2 mb-2 text-center font-medium italic">
            {feedback}
            {createdGroupCode && (
              <div className="mt-2 text-xs text-coral-700">Group Code: <span className="font-mono bg-coral-200 px-2 py-1 rounded">{createdGroupCode}</span></div>
            )}
          </div>
        )}
      </div>

      {/* My Groups */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-forest-800">My Groups</h2>
        {myGroups.length === 0 ? (
          <div className="text-center py-8 text-forest-600">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>You haven't joined any groups yet<br /><span className="italic text-primary-500">“Community is the soil in which presence grows.”</span></p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {myGroups.map((group) => (
              <motion.div
                key={group.id}
                className="bg-white rounded-lg border border-forest-200 p-4 hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-forest-900">{group.name}</h3>
                  {group.userRole === 'admin' && (
                    <Crown className="w-4 h-4 text-coral-500" />
                  )}
                </div>
                <p className="text-sm text-forest-600 mb-3">{group.description}</p>
                <div className="flex items-center justify-between text-xs text-forest-500">
                  <span>{group.memberCount} members</span>
                  <div className="flex gap-2">
                    <Button onClick={() => setShowQRModal(group.groupCode!)} size="sm" variant="secondary">Show QR</Button>
                    <Button
                      onClick={() => handleLeaveGroup(group.id)}
                      variant="destructive"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Public Groups */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-forest-800">Discover Groups</h2>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mx-auto"></div>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-8 text-forest-600">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No public groups available<br /><span className="italic text-primary-500">“Sometimes the right group is the one you create.”</span></p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <motion.div
                key={group.id}
                className="bg-white rounded-lg border border-forest-200 p-4 hover:shadow-md transition-shadow"
                whileHover={{ scale: 1.02 }}
              >
                <h3 className="font-semibold text-forest-900 mb-2">{group.name}</h3>
                <p className="text-sm text-forest-600 mb-3">{group.description}</p>
                <div className="flex items-center justify-between text-xs text-forest-500">
                  <span>{group.memberCount} members</span>
                  {!group.isMember && group.groupCode && (
                    <Button
                      onClick={async () => {
                        setJoinCode(group.groupCode!);
                        try {
                          await joinGroup(group.groupCode!);
                          setFeedback('Joined group successfully!');
                          loadGroups();
                        } catch {
                          setFeedback('Error joining group');
                        }
                      }}
                      size="sm"
                    >
                      Join
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-sm w-full relative">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">×</button>
            <h3 className="text-lg font-bold mb-2">Create a Group</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="Group Name"
                className="w-full border border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                required
              />
              <textarea
                value={newGroupDescription}
                onChange={e => setNewGroupDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full border border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                rows={3}
              />
              
              {/* Public/Private Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-900">Group Visibility</label>
                  <p className="text-xs text-gray-600">
                    {newGroupIsPublic ? 'Public groups are visible to all users' : 'Private groups are invite-only'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupIsPublic}
                    onChange={e => setNewGroupIsPublic(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {newGroupIsPublic ? 'Public' : 'Private'}
                  </span>
                </label>
              </div>
              
              <Button type="submit" className="w-full">Create</Button>
            </form>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-sm w-full relative">
            <button onClick={() => setShowJoinModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">×</button>
            <h3 className="text-lg font-bold mb-2">Join a Group</h3>
            <p className="text-sm text-gray-600 mb-4">Enter the group code shared by your friend or group admin.</p>
            <form onSubmit={handleJoinGroup} className="space-y-4">
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="Group Code"
                className="w-full border border-primary-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                required
              />
              <Button type="submit" className="w-full">Join</Button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-sm w-full relative">
            <button onClick={() => setShowQRModal(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">×</button>
            <h3 className="text-lg font-bold mb-2">Share Group</h3>
            <p className="text-sm text-gray-600 mb-4">Share this code or QR code with friends</p>
            
            <div className="flex flex-col items-center space-y-4">
              <QRCodeSVG value={`${window.location.origin}/join?code=${showQRModal}`} size={200} bgColor="#F7F3E9" fgColor="#1B4332" />
              
              <div className="bg-[#F7F3E9] p-4 rounded-lg w-full text-center">
                <p className="text-sm text-[#1B4332] mb-2">Group Code:</p>
                <p className="font-mono text-lg font-bold text-[#1B4332] bg-white px-3 py-2 rounded border-2 border-dashed border-[#1B4332]">
                  {showQRModal}
                </p>
                <button 
                  onClick={() => navigator.clipboard?.writeText(showQRModal)}
                  className="mt-2 text-xs text-[#1B4332] hover:underline"
                >
                  📋 Copy Code
                </button>
              </div>
              
              <p className="text-xs text-center text-gray-500">
                Friends can join by entering this code manually or scanning the QR code with any QR scanner app
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Join Modal - No camera required */}
      {showScanModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 shadow-lg max-w-sm w-full relative">
            <button onClick={() => setShowScanModal(false)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">×</button>
            <h3 className="text-lg font-bold mb-4">Join Group</h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Enter group code:</p>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-digit code"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center font-mono text-lg focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                  maxLength={6}
                />
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">OR</p>
                <p className="text-sm text-gray-600">Use any QR scanner app to scan a group QR code</p>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={() => setShowScanModal(false)} 
                  variant="secondary" 
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={async () => {
                    if (joinCode.trim()) {
                      const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                      await handleJoinGroup(fakeEvent);
                      setShowScanModal(false);
                    }
                  }}
                  className="flex-1"
                  disabled={!joinCode.trim()}
                >
                  Join
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
