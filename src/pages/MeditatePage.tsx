import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuthStore } from '../stores/authStore'
import { MeditationSession } from '../components/meditation/MeditationSession'
import { WisdomQuotes } from '../components/ui/WisdomQuotes'

export const MeditatePage = () => {
  const [showMeditation, setShowMeditation] = useState(false)
  const { user } = useAuthStore()

  const startMeditation = () => {
    setShowMeditation(true)
  }

  const endMeditation = () => {
    setShowMeditation(false)
  }

  if (showMeditation) {
    return <MeditationSession onEnd={endMeditation} />
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8"
    >
      <div className="text-center mb-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-primary-800 mb-4">
          Welcome back, {user?.displayName}
        </h2>
        <p className="text-primary-600 text-base sm:text-lg">
          Ready for your meditation journey?
        </p>
      </div>

      {/* Daily Wisdom Quote */}
      <div className="mb-8">
        <WisdomQuotes />
      </div>

      {/* Quick Start Meditation */}
      <div className="max-w-md mx-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={startMeditation}
          className="w-full bg-gradient-to-br from-primary-600 to-primary-800 text-white rounded-2xl p-6 sm:p-8 shadow-xl"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full"></div>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Start Meditation Session</h3>
          <p className="text-white/80 text-sm sm:text-base">Choose duration & frequency to begin</p>
        </motion.button>
      </div>

      {/* Frequency Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto mt-8">
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md">
          <h4 className="font-semibold text-primary-800 mb-2">Alpha Waves</h4>
          <p className="text-sm text-primary-600">8-13 Hz • Relaxation</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md">
          <h4 className="font-semibold text-primary-800 mb-2">Theta Waves</h4>
          <p className="text-sm text-primary-600">4-8 Hz • Deep meditation</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md">
          <h4 className="font-semibold text-primary-800 mb-2">Beta Waves</h4>
          <p className="text-sm text-primary-600">13-30 Hz • Focus</p>
        </div>
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-md">
          <h4 className="font-semibold text-primary-800 mb-2">Delta Waves</h4>
          <p className="text-sm text-primary-600">0.5-4 Hz • Deep sleep</p>
        </div>
      </div>
    </motion.div>
  )
}
