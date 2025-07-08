import { motion } from 'framer-motion'
import { Leaf, Trophy, Users, Heart, User } from 'lucide-react'

type Tab = 'meditate' | 'leaderboard' | 'groups' | 'friends' | 'profile'

interface NavigationProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

const iconMap = {
  meditate: Leaf,
  leaderboard: Trophy,
  groups: Users,
  friends: Heart,
  profile: User,
}

export const Navigation = ({ activeTab, onTabChange }: NavigationProps) => {
  const tabs = [
    { id: 'meditate', label: 'Meditate' },
    { id: 'leaderboard', label: 'Leaderboard' },
    { id: 'groups', label: 'Groups' },
    { id: 'friends', label: 'Friends' },
    { id: 'profile', label: 'Profile' },
  ] as const

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-primary-100 px-4 py-2 safe-area-pb">
      <div className="flex justify-around max-w-md mx-auto">
        {tabs.map((tab) => {
          const IconComponent = iconMap[tab.id]
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center space-y-1 py-2 px-4 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'text-primary-600 bg-primary-50'
                  : 'text-primary-400 hover:text-primary-600'
              }`}
            >
              <IconComponent size={20} />
              <span className="text-xs font-medium">{tab.label}</span>
            </motion.button>
          )
        })}
      </div>
    </nav>
  )
}
