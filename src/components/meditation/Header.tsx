import { motion } from 'framer-motion'
import { useAuthStore } from '../../stores/authStore'
import { Logo } from '../ui/Logo'

export const Header = () => {
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-white shadow-sm border-b border-primary-100">
      <div className="container mx-auto px-3 sm:px-4 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 sm:space-x-3"
          >
            <Logo size={28} className="w-7 h-7 sm:w-10 sm:h-10" />
            <div>
              <h1 className="text-sm sm:text-xl font-bold text-primary-800">CHRYSALIS</h1>
              <p className="text-primary-600 text-xs hidden sm:block">Meditation & Mindfulness</p>
            </div>
          </motion.div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm text-primary-800 font-medium">{user?.displayName || 'User'}</div>
              <div className="text-xs text-primary-600">Level {user?.level || 1} • {user?.experience || 0} XP</div>
            </div>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <img
                src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'User')}&background=1B4332&color=fff`}
                alt="Profile"
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-primary-200"
              />
              <button
                onClick={handleSignOut}
                className="text-primary-600 hover:text-primary-800 text-xs sm:text-sm px-2 py-1"
              >
                <span className="hidden sm:inline">Sign Out</span>
                <span className="sm:hidden">Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
