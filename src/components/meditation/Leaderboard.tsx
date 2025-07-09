import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy, AlertCircle, Medal, Crown, Award } from 'lucide-react';
import { apiService } from '../../services/api';

type LeaderboardType = 'global' | 'friends';

interface LeaderboardEntry {
  id: string;
  name?: string;
  displayName?: string;
  totalMinutes: number;
  currentStreak?: number;
  level: number;
  profilePicture?: string;
  isCurrentUser?: boolean;
  rank: number;
}

interface LeaderboardProps {
  refreshKey?: number;
}

export const Leaderboard = ({ refreshKey }: LeaderboardProps) => {
  const [activeBoard, setActiveBoard] = useState<LeaderboardType>('global');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const liveRegionRef = useRef<HTMLDivElement>(null);
  const refreshButtonRef = useRef<HTMLButtonElement>(null);
  const leaderboardRef = useRef<HTMLDivElement>(null);

  const fetchLeaderboard = useCallback(async (type: LeaderboardType) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      switch (type) {
        case 'global':
          response = await apiService.getGlobalLeaderboard();
          break;
        case 'friends':
          response = await apiService.getFriendsLeaderboard();
          break;
        default:
          response = await apiService.getGlobalLeaderboard();
      }
      
      if (!response) {
        setLeaderboardData([]);
        setError('Leaderboard service is temporarily unavailable.');
        return;
      }
      
      const leaderboard = response.leaderboard || [];
      if (!Array.isArray(leaderboard)) {
        setLeaderboardData([]);
        setError('Leaderboard data format is invalid. Please try refreshing.');
        return;
      }
      
      setLeaderboardData(leaderboard);
    } catch (err: unknown) {
      console.error('Leaderboard fetch error:', err);
      setLeaderboardData([]);
      if (err instanceof Error) {
        if (err.message.includes('429')) {
          setError('Too many requests. Please wait a moment before refreshing.');
        } else {
          setError(`Unable to load ${type} leaderboard. Please try again.`);
        }
      } else {
        setError(`Failed to load ${type} leaderboard. Please check your connection and try again.`);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard(activeBoard);
    // Optionally, add a timer to auto-refresh after meditation session completion
    // const interval = setInterval(() => {
    //   fetchLeaderboard(activeBoard);
    // }, 60000); // Refresh every minute
    // return () => clearInterval(interval);
  }, [activeBoard, refreshKey, fetchLeaderboard]);

  // Focus management for error/refresh
  useEffect(() => {
    if (error && refreshButtonRef.current) {
      refreshButtonRef.current.focus();
    }
  }, [error]);

  // Announce leaderboard updates
  useEffect(() => {
    if (liveRegionRef.current && !loading && !error) {
      liveRegionRef.current.textContent = `Leaderboard updated. ${leaderboardData.length} users shown.`;
    }
  }, [leaderboardData, loading, error]);

  // Accessibility: focus ref for skip link
  const skipToLeaderboard = () => {
    leaderboardRef.current?.focus();
  };

  const getRankSuffix = (rank: number) => {
    if (rank === 1) return 'st';
    if (rank === 2) return 'nd';
    if (rank === 3) return 'rd';
    return 'th';
  };

  return (
    <>
      {/* Skip Link for Accessibility */}
      <a
        href="#main-leaderboard"
        className="sr-only focus:not-sr-only absolute left-2 top-2 z-50 bg-primary-800 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-accent"
        onClick={e => {
          e.preventDefault();
          skipToLeaderboard();
        }}
      >
        Skip to Leaderboard
      </a>
      {/* Daily Wisdom Quote */}
      <div className="mb-6 text-center">
        <blockquote className="italic text-primary-700 text-lg max-w-xl mx-auto">
          "Be present in all things and thankful for all things."
          <br />
          <span className="block mt-2 text-primary-500 text-sm">– Maya Angelou</span>
        </blockquote>
      </div>
      <motion.div
        ref={leaderboardRef}
        id="main-leaderboard"
        tabIndex={-1}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 py-8 outline-none"
        role="region"
        aria-labelledby="leaderboard-heading"
        aria-live="polite"
      >
        {/* Visually hidden heading for screen readers */}
        <h1 className="sr-only" id="leaderboard-main">Leaderboard Main Content</h1>
        {/* Live region for updates */}
        <div
          ref={liveRegionRef}
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        <div className="text-center mb-8">
          <h2 id="leaderboard-heading" className="text-3xl font-bold text-primary-800 mb-2">Leaderboard</h2>
          <p className="text-primary-600">See how you rank among meditators</p>
        </div>
        {/* Board Selection */}
        <div className="flex justify-center mb-8" role="tablist" aria-label="Leaderboard type">
          <div className="bg-white rounded-xl p-1 shadow-md flex items-center gap-2">
            {(['global', 'friends'] as const).map((board) => (
              <button
                key={board}
                onClick={() => setActiveBoard(board)}
                className={`px-6 py-2 rounded-lg font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  activeBoard === board
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-primary-600 hover:bg-primary-50'
                }`}
                role="tab"
                aria-selected={activeBoard === board}
                aria-controls={`leaderboard-panel-${board}`}
                id={`leaderboard-tab-${board}`}
                tabIndex={activeBoard === board ? 0 : -1}
              >
                {board.charAt(0).toUpperCase() + board.slice(1)}
              </button>
            ))}
            <button
              ref={refreshButtonRef}
              onClick={() => fetchLeaderboard(activeBoard)}
              className="ml-2 px-4 py-2 rounded-lg bg-primary-100 text-primary-700 font-medium hover:bg-primary-200 transition-all border border-primary-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Refresh Leaderboard"
            >
              Refresh
            </button>
          </div>
        </div>
        {/* Leaderboard List */}
        <div
          className="max-w-2xl mx-auto space-y-3"
          id={`leaderboard-panel-${activeBoard}`}
          role="tabpanel"
          aria-labelledby={`leaderboard-tab-${activeBoard}`}
        >
          {loading ? (
            <div className="text-center py-8" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" aria-hidden="true"></div>
              <p className="text-gray-500 mt-2">Loading leaderboard...</p>
              <p className="text-primary-500 mt-2 italic">Take a mindful breath while you wait.</p>
            </div>
          ) : error ? (
            <div className="text-center py-8" aria-live="assertive" tabIndex={-1}>
              <AlertCircle className="text-red-500 mb-2 mx-auto" size={32} aria-hidden="true" />
              <p className="text-red-600">{error}</p>
              <p className="text-primary-500 mt-2">Progress is personal and unique to everyone.</p>
              <button
                onClick={() => fetchLeaderboard(activeBoard)}
                className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                aria-label="Retry loading leaderboard"
              >
                Retry
              </button>
            </div>
          ) : leaderboardData.length === 0 ? (
            <div className="text-center py-8 text-gray-500" aria-live="polite">
              <Trophy className="mx-auto mb-4" size={48} aria-hidden="true" />
              <p>No data available for this leaderboard</p>
              <p className="text-primary-500 mt-2 italic">Every journey begins with a single mindful moment.</p>
            </div>
          ) : (
            <ul className="space-y-3" role="list">
              {leaderboardData.map((user, index) => {
                const rank = user.rank || index + 1;
                const isTopThree = rank <= 3;
                const isUser = user.isCurrentUser;
                const displayName = user.displayName || user.name || 'Unknown User';
                const generateAvatar = (name: string) => {
                  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                };
                return (
                  <motion.li
                    key={user.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center p-4 rounded-xl shadow-md transition-all focus-within:ring-2 focus-within:ring-accent ${
                      isUser
                        ? 'bg-gradient-to-r from-primary-100 to-primary-50 border-2 border-primary-300'
                        : 'bg-white hover:shadow-lg'
                    }`}
                    aria-current={isUser ? 'true' : undefined}
                    tabIndex={0}
                  >
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      isTopThree
                        ? rank === 1
                          ? 'bg-yellow-100 text-yellow-600'
                          : rank === 2
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-orange-100 text-orange-600'
                        : 'bg-primary-100 text-primary-600'
                    }`} aria-label={`Rank ${rank}`}> 
                      {isTopThree ? (
                        <div className="flex items-center justify-center">
                          {rank === 1 && <Crown className="w-5 h-5 text-yellow-400" aria-label="1st place" role="img" />}
                          {rank === 2 && <Medal className="w-5 h-5 text-gray-300" aria-label="2nd place" role="img" />}
                          {rank === 3 && <Award className="w-5 h-5 text-yellow-600" aria-label="3rd place" role="img" />}
                        </div>
                      ) : (
                        `${rank}${getRankSuffix(rank)}`
                      )}
                    </div>
                    {/* Avatar */}
                    <div className="flex-shrink-0 w-12 h-12 ml-4">
                      {user.profilePicture ? (
                        <img
                          src={user.profilePicture}
                          alt={displayName + "'s profile picture"}
                          className="w-12 h-12 rounded-full border-2 border-primary-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-lg" aria-label={`Avatar for ${displayName}`} role="img">
                          {generateAvatar(displayName)}
                        </div>
                      )}
                    </div>
                    {/* User Info */}
                    <div className="flex-1 ml-4">
                      <div className="flex items-center space-x-2">
                        <h3 className={`font-semibold ${isUser ? 'text-primary-800' : 'text-gray-800'}`}>{displayName}</h3>
                        {isUser && <span className="text-primary-600 text-sm">(You)</span>}
                      </div>
                      <p className="text-sm text-gray-600">
                        Level {user.level} • {user.currentStreak || 0} day streak
                      </p>
                    </div>
                    {/* Stats */}
                    <div className="text-right">
                      <div className="font-bold text-primary-800">{typeof user.totalMinutes === 'number' && !isNaN(user.totalMinutes) ? user.totalMinutes.toLocaleString() : '0'}</div>
                      <div className="text-sm text-primary-600">minutes</div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>
        {/* Your Stats Summary */}
        {activeBoard === 'global' && (
          <div className="max-w-2xl mx-auto mt-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white text-center" role="region" aria-label="Your Global Ranking">
            <h3 className="text-lg font-bold mb-2">Your Global Ranking</h3>
            {(() => {
              const currentUser = leaderboardData.find(user => user.isCurrentUser);
              return (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-2xl font-bold">#{currentUser?.rank || '?'}</div>
                    <div className="text-primary-200 text-sm">Global Rank</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{currentUser?.totalMinutes || 0}</div>
                    <div className="text-primary-200 text-sm">Total Minutes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{currentUser?.currentStreak || 0}</div>
                    <div className="text-primary-200 text-sm">Day Streak</div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </motion.div>
    </>
  );
};
