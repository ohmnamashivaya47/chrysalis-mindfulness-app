import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Users, 
  Target, 
  Bell, 
  ChevronRight, 
  ChevronLeft,
  Sparkles 
} from 'lucide-react';
import { Button } from '../ui';

interface OnboardingFlowProps {
  onComplete: () => void;
}

const steps = [
  {
    id: 1,
    title: "Welcome to Chrysalis",
    description: "Your mindful meditation companion that grows with your practice",
    icon: Sparkles,
    content: "Chrysalis helps you cultivate presence through guided meditation, mindful moments, and community connection."
  },
  {
    id: 2,
    title: "Track Your Journey",
    description: "Monitor your meditation progress and build lasting habits",
    icon: Target,
    content: "See your streaks, session history, and watch your mindfulness level grow with each practice."
  },
  {
    id: 3,
    title: "Connect with Others",
    description: "Join a supportive community of fellow practitioners",
    icon: Users,
    content: "Add friends, join meditation groups, and share your journey with like-minded individuals."
  },
  {
    id: 4,
    title: "Gentle Reminders",
    description: "Stay present with mindful micro-interventions",
    icon: Bell,
    content: "Receive gentle 2-10 second breathing reminders throughout your day to anchor you in the present moment."
  },
  {
    id: 5,
    title: "Begin Your Practice",
    description: "Your meditation sanctuary awaits",
    icon: Heart,
    content: "Everything is ready. Take a deep breath, and let's begin this beautiful journey of presence together."
  }
];

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentStepData = steps[currentStep];
  const IconComponent = currentStepData.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-background-primary to-accent-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index <= currentStep 
                    ? 'bg-primary-600' 
                    : 'bg-primary-200'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-primary-600 text-sm mt-2">
            {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center"
          >
            {/* Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-100 rounded-full mb-6">
              <IconComponent className="w-10 h-10 text-primary-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-primary-800 mb-3">
              {currentStepData.title}
            </h2>

            {/* Description */}
            <p className="text-primary-600 mb-4 font-medium">
              {currentStepData.description}
            </p>

            {/* Content */}
            <p className="text-primary-700 leading-relaxed mb-8">
              {currentStepData.content}
            </p>

            {/* Navigation */}
            <div className="flex justify-between items-center">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>

              <Button
                onClick={nextStep}
                className="flex items-center gap-2"
              >
                {currentStep === steps.length - 1 ? 'Start Meditating' : 'Continue'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Skip option */}
        {currentStep < steps.length - 1 && (
          <div className="text-center mt-6">
            <button
              onClick={onComplete}
              className="text-primary-600 hover:text-primary-700 text-sm transition-colors"
            >
              Skip introduction
            </button>
          </div>
        )}

        {/* Inspirational quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-8"
        >
          <blockquote className="text-primary-700 italic text-sm">
            "The journey of a thousand miles begins with a single step."
          </blockquote>
          <cite className="text-primary-500 text-xs block mt-1">— Lao Tzu</cite>
        </motion.div>
      </div>
    </div>
  );
};
