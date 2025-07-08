import React, { useState, useEffect } from 'react'

interface BreathingGuideProps {
  isActive: boolean
  onComplete?: () => void
  duration?: number // in seconds
  type?: 'micro' | 'full'
}

export const BreathingGuide: React.FC<BreathingGuideProps> = ({ 
  isActive, 
  onComplete, 
  duration = 10,
  type = 'micro'
}) => {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale')
  const [timeLeft, setTimeLeft] = useState(duration)
  const [cycles, setCycles] = useState(0)
  
  // Breathing pattern: 4 seconds inhale, 2 seconds hold, 6 seconds exhale
  const breathingPattern = {
    inhale: 4,
    hold: 2,
    exhale: 6
  }
  
  const totalCycleTime = breathingPattern.inhale + breathingPattern.hold + breathingPattern.exhale
  const targetCycles = Math.ceil(duration / totalCycleTime)
  
  useEffect(() => {
    if (!isActive) return
    
    let phaseTimer: number
    // Countdown timer
    const countdownTimer = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    
    const runBreathingCycle = () => {
      const cyclePhases = [
        { phase: 'inhale' as const, duration: breathingPattern.inhale },
        { phase: 'hold' as const, duration: breathingPattern.hold },
        { phase: 'exhale' as const, duration: breathingPattern.exhale }
      ]
      
      const runPhase = (phaseIndex: number) => {
        if (phaseIndex >= cyclePhases.length) {
          setCycles(prev => prev + 1)
          if (cycles + 1 >= targetCycles) {
            onComplete?.()
            return
          }
          runPhase(0) // Start new cycle
          return
        }
        
        const currentPhase = cyclePhases[phaseIndex]
        setPhase(currentPhase.phase)
        
        phaseTimer = window.setTimeout(() => {
          runPhase(phaseIndex + 1)
        }, currentPhase.duration * 1000)
      }
      
      runPhase(0)
    }
    
    runBreathingCycle()
    
    return () => {
      clearTimeout(phaseTimer)
      clearInterval(countdownTimer)
    }
  }, [isActive, cycles, targetCycles, onComplete, duration, breathingPattern.exhale, breathingPattern.hold, breathingPattern.inhale])
  
  const getInstructions = () => {
    switch (phase) {
      case 'inhale':
        return type === 'micro' ? 'Breathe in...' : 'Gently breathe in through your nose'
      case 'hold':
        return type === 'micro' ? 'Hold...' : 'Hold your breath softly'
      case 'exhale':
        return type === 'micro' ? 'Breathe out...' : 'Slowly exhale through your mouth'
    }
  }
  
  const getCircleScale = () => {
    switch (phase) {
      case 'inhale':
        return 'scale-110'
      case 'hold':
        return 'scale-110'
      case 'exhale':
        return 'scale-100'
    }
  }
  
  if (!isActive) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background-primary rounded-2xl p-8 max-w-md w-full mx-4 text-center">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-primary-800 mb-2">
            {type === 'micro' ? 'Mindful Moment' : 'Breathing Practice'}
          </h2>
          <p className="text-primary-600 text-sm">
            {timeLeft}s remaining
          </p>
        </div>
        
        <div className="relative mb-8">
          <div className={`w-32 h-32 mx-auto rounded-full breathing-circle transition-transform duration-2000 ${getCircleScale()}`}>
            <div className="absolute inset-4 bg-accent-coral rounded-full opacity-70 animate-pulse" />
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-lg spiritual-text mb-2">
            {getInstructions()}
          </p>
          <div className="w-16 h-1 bg-accent-coral mx-auto rounded-full" />
        </div>
        
        <div className="flex justify-between items-center text-sm text-primary-600">
          <span>Cycle {cycles + 1} of {targetCycles}</span>
          <button 
            onClick={onComplete}
            className="text-accent-coral hover:text-accent-coral-dark transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
