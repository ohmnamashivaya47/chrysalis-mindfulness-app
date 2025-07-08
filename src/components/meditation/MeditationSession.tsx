import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle } from 'lucide-react'
import { useMeditationStore } from '../../stores/meditationStore'

interface MeditationSessionProps {
  onEnd: () => void
}

type Phase = 'preparation' | 'meditation' | 'completion'
type FrequencyType = 'alpha' | 'theta' | 'beta' | 'delta'
type DurationType = 3 | 10 | 20 | 30 | 40 | 50 | 60

const frequencies = {
  alpha: { hz: 10, name: 'Alpha Waves', description: 'Relaxation & Calm' },
  theta: { hz: 6, name: 'Theta Waves', description: 'Deep Meditation' },
  beta: { hz: 20, name: 'Beta Waves', description: 'Focus & Clarity' },
  delta: { hz: 2, name: 'Delta Waves', description: 'Deep Rest' }
}

export const MeditationSession = ({ onEnd }: MeditationSessionProps) => {
  const [phase, setPhase] = useState<Phase>('preparation')
  const [selectedDuration, setSelectedDuration] = useState<DurationType>(10)
  const [timeLeft, setTimeLeft] = useState(0)
  const [selectedFrequency, setSelectedFrequency] = useState<FrequencyType>('alpha')
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [noAudio, setNoAudio] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  
  const meditation = useMeditationStore()

  // Initialize audio context
  useEffect(() => {
    const AudioCtx = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioContextRef.current = new AudioCtx()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  // Start binaural beats
  // const startBinauralBeats = (frequency: FrequencyType) => {
  //   if (!audioContextRef.current) return

  //   const audioContext = audioContextRef.current
  //   const freq = frequencies[frequency].hz

  //   // Create oscillators for binaural beats
  //   const oscillator1 = audioContext.createOscillator()
  //   const oscillator2 = audioContext.createOscillator()
  //   const gainNode = audioContext.createGain()

  //   oscillator1.frequency.setValueAtTime(200, audioContext.currentTime) // Base frequency
  //   oscillator2.frequency.setValueAtTime(200 + freq, audioContext.currentTime) // Base + binaural frequency

  //   oscillator1.type = 'sine'
  //   oscillator2.type = 'sine'
  //   gainNode.gain.value = 0.1

  //   oscillator1.connect(gainNode).connect(audioContext.destination)
  //   oscillator2.connect(gainNode)

  //   oscillator1.start()
  //   oscillator2.start()
  //   audioContextRef.current['osc1'] = oscillator1
  //   audioContextRef.current['osc2'] = oscillator2
  // }

  // Stop binaural beats
  const stopBinauralBeats = () => {
    if (oscillatorRef.current && gainNodeRef.current) {
      oscillatorRef.current.stop()
      gainNodeRef.current.disconnect()
    }
  }

  const handleSessionComplete = useCallback(async () => {
    try {
      meditation.startSession(selectedDuration, selectedFrequency)
      await meditation.completeSession()
    } catch (error) {
      console.error('Error completing session:', error)
    }
  }, [meditation, selectedDuration, selectedFrequency])

  // Timer countdown
  useEffect(() => {
    if (phase === 'meditation' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Session completed! Use meditation store to complete session
            if (!sessionCompleted) {
              setSessionCompleted(true)
              handleSessionComplete()
            }
            setPhase('completion')
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [phase, timeLeft, sessionCompleted, selectedDuration, handleSessionComplete])

  // End session
  const endSession = () => {
    stopBinauralBeats()
    onEnd()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = ((selectedDuration * 60 - timeLeft) / (selectedDuration * 60)) * 100

  const durations: DurationType[] = [3, 10, 20, 30, 40, 50, 60]

  // Breathing phase logic
  const breathingPhases = useMemo(() => [
    { label: 'Breathe In', duration: 4 },
    { label: 'Hold', duration: 4 },
    { label: 'Breathe Out', duration: 4 },
    { label: 'Hold', duration: 4 },
  ], [])
  const [breathPhaseLabel, setBreathPhaseLabel] = useState(breathingPhases[0].label)

  useEffect(() => {
    if (phase !== 'meditation') return
    setBreathPhaseLabel(breathingPhases[0].label)
    let phaseIdx = 0
    let timeout: ReturnType<typeof setTimeout>
    const nextPhase = () => {
      phaseIdx = (phaseIdx + 1) % breathingPhases.length
      setBreathPhaseLabel(breathingPhases[phaseIdx].label)
      timeout = setTimeout(nextPhase, breathingPhases[phaseIdx].duration * 1000)
    }
    timeout = setTimeout(nextPhase, breathingPhases[0].duration * 1000)
    return () => clearTimeout(timeout)
  }, [phase, breathingPhases])

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 text-center text-white px-6 max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {phase === 'preparation' && (
            <motion.div
              key="preparation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-bold mb-4">Set Your Session</h2>
                <p className="text-white/80">Choose duration and frequency for your meditation</p>
              </div>

              {/* Duration Selection */}
              <div>
                <h3 className="text-xl font-bold mb-4">Duration</h3>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {durations.map((duration) => (
                    <motion.button
                      key={duration}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedDuration(duration)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        selectedDuration === duration
                          ? 'border-white bg-white/20'
                          : 'border-white/30 bg-white/10'
                      }`}
                    >
                      <div className="font-bold">{duration}m</div>
                      <div className="text-xs text-white/60">
                        {duration === 3 ? 'Quick' : duration <= 20 ? 'Short' : duration <= 40 ? 'Medium' : 'Long'}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Frequency Selection */}
              <div>
                <h3 className="text-xl font-bold mb-4">Binaural Frequency</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(frequencies).map(([key, freq]) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedFrequency(key as FrequencyType)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedFrequency === key
                          ? 'border-white bg-white/20'
                          : 'border-white/30 bg-white/10'
                      }`}
                    >
                      <div className="text-lg font-bold">{freq.name}</div>
                      <div className="text-sm text-white/80">{freq.hz} Hz</div>
                      <div className="text-xs text-white/60">{freq.description}</div>
                    </motion.button>
                  ))}
                </div>
                <div className="flex items-center justify-center mt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={noAudio}
                      onChange={() => setNoAudio(v => !v)}
                      className="form-checkbox h-5 w-5 text-primary-600"
                    />
                    <span className="text-white font-medium">No Audio</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4 mt-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setTimeLeft(selectedDuration * 60)
                    setPhase('meditation')
                    meditation.startSession(selectedDuration, selectedFrequency)
                  }}
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg"
                >
                  Start Meditation ({selectedDuration} min)
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onEnd}
                  className="w-full bg-white/20 text-white font-medium py-3 px-6 rounded-xl border border-white/30"
                >
                  Back to Home
                </motion.button>
              </div>
            </motion.div>
          )}

          {phase === 'meditation' && (
            <motion.div
              key="meditation"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="space-y-8"
            >
              {/* Breathing Phase Label - prominent and centered */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-3/4 z-10 w-full flex justify-center">
                <span
                  className={
                    `text-4xl md:text-5xl font-bold transition-colors duration-700 ` +
                    (breathPhaseLabel === 'Breathe In' ? 'text-primary-700' :
                     breathPhaseLabel === 'Hold' ? 'text-coral-600' :
                     breathPhaseLabel === 'Breathe Out' ? 'text-forest-700' : 'text-primary-800')
                  }
                  aria-live="polite"
                >
                  {breathPhaseLabel}
                </span>
              </div>

              {/* Breathing Circle */}
              <div className="relative w-64 h-64 mx-auto">
                <motion.div
                  animate={{
                    scale: breathPhaseLabel === 'Breathe In' ? [1, 1.2] : breathPhaseLabel === 'Breathe Out' ? [1.2, 1] : 1,
                    backgroundColor: breathPhaseLabel === 'Breathe In' ? '#F7F3E9' : breathPhaseLabel === 'Hold' ? '#FF8A65' : '#1B4332',
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="w-full h-full rounded-full flex items-center justify-center border-2 border-white/40"
                >
                  <motion.div
                    animate={{
                      scale: breathPhaseLabel === 'Breathe In' ? [0.8, 1] : breathPhaseLabel === 'Breathe Out' ? [1, 0.8] : 1,
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="w-32 h-32 bg-white/30 rounded-full"
                  />
                </motion.div>
                
                {/* Progress Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="120"
                    fill="none"
                    stroke="white"
                    strokeOpacity="0.2"
                    strokeWidth="3"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="120"
                    fill="none"
                    stroke="white"
                    strokeWidth="3"
                    strokeDasharray={`${2 * Math.PI * 120}`}
                    strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
              </div>

              <div className="space-y-4">
                <div className="text-4xl font-bold">{formatTime(timeLeft)}</div>
                <div className="text-white/80">
                  {frequencies[selectedFrequency].name} • {frequencies[selectedFrequency].description}
                </div>
                <div className="text-white/60 text-lg font-semibold transition-all duration-500" key={breathPhaseLabel}>
                  {breathPhaseLabel}
                </div>
              </div>

              <button
                onClick={endSession}
                className="text-white/60 hover:text-white text-sm"
              >
                End Session
              </button>
            </motion.div>
          )}

          {phase === 'completion' && (
            <motion.div
              key="completion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <CheckCircle size={48} className="mx-auto mb-4 text-white" />
              <div>
                <h2 className="text-3xl font-bold mb-4">Session Complete!</h2>
                <p className="text-white/80">{selectedDuration} minutes of mindful meditation</p>
              </div>

              <div className="bg-white/20 rounded-xl p-6 space-y-2">
                <div className="text-lg font-bold">+{selectedDuration * 2} XP Gained</div>
                <div className="text-white/80">Duration: {selectedDuration} minutes</div>
                <div className="text-white/80">Frequency: {frequencies[selectedFrequency].name}</div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={endSession}
                className="w-full bg-white text-primary-800 font-bold py-4 px-8 rounded-xl"
              >
                Continue
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
