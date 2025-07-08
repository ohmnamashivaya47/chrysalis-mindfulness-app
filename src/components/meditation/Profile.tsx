import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Clock, Star, Crown, Trophy, Leaf, BarChart3, CheckCircle, Camera } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useMeditationStore } from '../../stores/meditationStore';
import { apiService } from '../../services/api';
import { cloudinaryService } from '../../services/cloudinary';

export const Profile = () => {
  const { user, setUser } = useAuthStore();
  const { sessionHistory, sessionStats, getSessionHistory, loading } = useMeditationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: user?.displayName || '',
    profilePicture: user?.profilePicture || ''
  });
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false); // NEW: loading state for save

  // Accessibility: focus ref for skip link and live region
  const profileRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (saveSuccess && liveRegionRef.current) {
      liveRegionRef.current.textContent = saveSuccess;
    } else if (saveError && liveRegionRef.current) {
      liveRegionRef.current.textContent = saveError;
    }
  }, [saveSuccess, saveError]);

  // Move focus to feedback for accessibility
  useEffect(() => {
    if ((saveSuccess || saveError) && liveRegionRef.current) {
      liveRegionRef.current.focus(); // Move focus for accessibility
    }
  }, [saveSuccess, saveError]);

  // Fetch session history on mount
  useEffect(() => {
    getSessionHistory().catch(console.error);
  }, [getSessionHistory]);

  const handleSave = async () => {
    if (user) {
      setSaveError(null);
      setSaveSuccess(null);
      setSaving(true); // NEW: set saving state
      try {
        const updated = await apiService.updateProfile({
          displayName: editForm.displayName,
          profilePicture: editForm.profilePicture
        });
        setUser(updated.user);
        setIsEditing(false);
        setSaveSuccess('Profile updated successfully!\n\u2014 Your presence is a gift to the world.');
      } catch (err: unknown) {
        if (err instanceof Error) {
          setSaveError(err.message + '\n\u2014 Remember, you are enough just as you are.');
        } else {
          setSaveError('Failed to update profile.\n\u2014 Remember, you are enough just as you are.');
        }
      } finally {
        setSaving(false); // NEW: reset saving state
      }
    }
  };

  const handleCancel = () => {
    setEditForm({
      displayName: user?.displayName || '',
      profilePicture: user?.profilePicture || ''
    });
    setIsEditing(false);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setSaveError(null);
    try {
      const result = await cloudinaryService.uploadProfilePicture(file);
      setEditForm(prev => ({ ...prev, profilePicture: result.secure_url }));
      setSaveSuccess('Profile picture uploaded successfully!');
    } catch (error) {
      setSaveError('Failed to upload image. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const generateAvatar = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1B4332&color=fff&size=200`;
  };

  const stats = [
    { label: 'Total Sessions', value: sessionStats?.totalSessions || user?.totalSessions || 0 },
    { label: 'Total Minutes', value: sessionStats?.totalMinutes || user?.totalMinutes || 0 },
    { label: 'Current Streak', value: sessionStats?.currentStreak || user?.currentStreak || 0, unit: 'days' },
    { label: 'Weekly Minutes', value: sessionStats?.weeklyMinutes || 0, unit: 'this week' },
    { label: 'Level', value: user?.level || 1 },
    { label: 'Experience', value: user?.experience || 0, unit: 'XP' }
  ];

  const achievements = [
    { id: 1, name: 'First Session', description: 'Complete your first meditation', earned: (sessionStats?.totalSessions || user?.totalSessions || 0) > 0, icon: Leaf },
    { id: 2, name: 'Week Warrior', description: '7-day meditation streak', earned: (sessionStats?.currentStreak || user?.currentStreak || 0) >= 7, icon: Award },
    { id: 3, name: 'Time Master', description: 'Meditate for 60 minutes total', earned: (sessionStats?.totalMinutes || user?.totalMinutes || 0) >= 60, icon: Clock },
    { id: 4, name: 'Level Up', description: 'Reach level 3', earned: (user?.level || 1) >= 3, icon: Star },
    { id: 5, name: 'Consistency King', description: '30-day meditation streak', earned: (sessionStats?.currentStreak || user?.currentStreak || 0) >= 30, icon: Crown },
    { id: 6, name: 'Zen Master', description: 'Complete 100 sessions', earned: (sessionStats?.totalSessions || user?.totalSessions || 0) >= 100, icon: Trophy }
  ];

  const skipToProfile = () => {
    profileRef.current?.focus();
  };

  return (
    <>
      {/* Skip Link for Accessibility */}
      <a
        href="#main-profile"
        className="sr-only focus:not-sr-only absolute left-2 top-2 z-50 bg-primary-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
        onClick={e => {
          e.preventDefault();
          skipToProfile();
        }}
      >
        Skip to Profile
      </a>
      <motion.div
        ref={profileRef}
        id="main-profile"
        tabIndex={-1}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8 outline-none"
        role="main"
        aria-labelledby="profile-heading"
        aria-live="polite"
      >
        {/* Visually hidden heading for screen readers */}
        <h1 className="sr-only" id="profile-main">Profile Main Content</h1>
        {/* Live region for updates */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        {/* Daily Wisdom Quote */}
        <div className="mb-6 text-center">
          <blockquote className="italic text-primary-700 text-lg max-w-xl mx-auto">
            "The present moment is filled with joy and happiness. If you are attentive, you will see it."<br />
            <span className="block mt-2 text-primary-500 text-sm">– Thich Nhat Hanh</span>
          </blockquote>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-md p-8 mb-8">
          {saveError && <div ref={liveRegionRef} tabIndex={-1} aria-live="assertive" className="bg-red-100 text-red-700 rounded px-4 py-2 mb-2 font-medium italic">{saveError}</div>}
          {saveSuccess && <div ref={liveRegionRef} tabIndex={-1} aria-live="polite" className="bg-green-100 text-green-700 rounded px-4 py-2 mb-2 font-medium italic">{saveSuccess}</div>}
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <img
                src={editForm.profilePicture || generateAvatar(user?.displayName || 'User')}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-primary-200"
              />
              {isEditing && (
                <div className="mt-4 space-y-3">
                  <input
                    type="url"
                    placeholder="Profile picture URL"
                    value={editForm.profilePicture}
                    onChange={(e) => setEditForm(prev => ({ ...prev, profilePicture: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  <div className="text-center text-sm text-gray-500">or</div>
                  <div className="relative">
                    <input
                      type="file"
                      id="profile-upload"
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleFileUpload(file);
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="profile-upload"
                      className={`flex items-center justify-center gap-2 w-full px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm cursor-pointer hover:bg-gray-50 ${
                        uploading ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Camera className="w-4 h-4" />
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div>
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    className="text-2xl font-bold text-primary-800 border-b-2 border-primary-300 bg-transparent focus:outline-none focus:border-primary-600 mb-2"
                  />
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={handleSave}
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      disabled={uploading || !editForm.displayName.trim() || saving}
                      aria-busy={saving}
                    >
                      {saving && <span className="animate-spin h-4 w-4 border-b-2 border-white rounded-full mr-2"></span>}
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-2xl font-bold text-primary-800 mb-2">{user?.displayName}</h2>
                  <p className="text-primary-600 mb-2">{user?.email}</p>
                  <p className="text-sm text-primary-500">
                    Member since {user?.joinedAt ? new Date(user.joinedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}
                  </p>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 text-primary-600 hover:text-primary-800 text-sm font-medium"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-md p-6 text-center"
            >
              <div className="text-2xl font-bold text-primary-800 mb-1">
                {stat.value.toLocaleString()}
                {stat.unit && <span className="text-sm text-primary-600 ml-1">{stat.unit}</span>}
              </div>
              <div className="text-sm text-primary-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl shadow-md p-8">
          <h3 className="text-xl font-bold text-primary-800 mb-6">Achievements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  achievement.earned
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 bg-gray-50 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`${achievement.earned ? 'text-primary-600' : 'text-gray-400'}`}>
                    <achievement.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      achievement.earned ? 'text-primary-800' : 'text-gray-600'
                    }`}>
                      {achievement.name}
                    </h4>
                    <p className={`text-sm ${
                      achievement.earned ? 'text-primary-600' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>
                  </div>
                  {achievement.earned && (
                    <div className="text-primary-600">
                      <CheckCircle size={20} />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-xl shadow-md p-8 mt-8">
          <h3 className="text-xl font-bold text-primary-800 mb-6">Recent Sessions</h3>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading session history...</p>
            </div>
          ) : sessionHistory && sessionHistory.length > 0 ? (
            <div className="space-y-4">
              {sessionHistory.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-background rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-600">
                        {session.frequency?.toUpperCase()[0] || 'M'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.duration} minute {session.frequency} meditation
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.completedAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-primary-600">+{session.xpGained || 0} XP</p>
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle size={12} /> Completed
                    </p>
                  </div>
                </div>
              ))}
              {sessionHistory.length > 5 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-gray-500">
                    Showing 5 of {sessionHistory.length} sessions
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="mx-auto mb-4" size={48} />
              <p>Session history will appear here after you complete meditations</p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};
