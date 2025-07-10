import { motion } from 'framer-motion'
import { Leaf, Trophy, Users, Heart, User } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'

const iconMap = {
  '/': Leaf,
  '/leaderboard': Trophy,
  '/groups': Users,
  '/friends': Heart,
  '/profile': User,
}

export const Navigation = () => {
  const navigate = useNavigate()
  const location = useLocation()
  
  const routes = [
    { path: '/', label: 'Meditate' },
    { path: '/leaderboard', label: 'Leaderboard' },
    { path: '/groups', label: 'Groups' },
    { path: '/friends', label: 'Friends' },
    { path: '/profile', label: 'Profile' },
  ] as const

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="w-full px-2 py-2 safe-area-pb">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {routes.map((route) => {
            const IconComponent = iconMap[route.path]
            const isActive = location.pathname === route.path
            return (
              <motion.button
                key={route.path}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(route.path)}
                className={`flex flex-col items-center space-y-1 py-2 px-2 rounded-lg transition-all duration-200 min-w-0 flex-1 ${
                  isActive
                    ? 'text-[#1B4332] bg-[#1B4332]/5'
                    : 'text-gray-500 hover:text-[#1B4332]'
                }`}
              >
                <IconComponent className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{route.label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
