import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoginScreen } from './components/auth/LoginScreen';
import { OnboardingFlow } from './components/auth/OnboardingFlow';
import { AppLayout } from './components/AppLayout';

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
          <BrowserRouter>
            <AppLayout />
          </BrowserRouter>
        )}
      </div>
    </div>
  );
}

export default App;
