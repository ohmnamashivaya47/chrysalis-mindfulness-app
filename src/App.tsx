import { useAuthStore } from './stores/authStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingFlow } from './components/auth/OnboardingFlow';
import { MeditationApp } from './components/meditation/MeditationApp';

function App() {
  const { user, showOnboarding, completeOnboarding } = useAuthStore();

  return (
    <div className="min-h-screen w-full bg-warm-beige overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto">
        {!user ? (
          <LoginScreen />
        ) : showOnboarding ? (
          <OnboardingFlow onComplete={completeOnboarding} />
        ) : (
          <MeditationApp />
        )}
      </div>
    </div>
  );
}

export default App;
