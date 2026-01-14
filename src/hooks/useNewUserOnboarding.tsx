import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_SHOWN_KEY = 'onboarding_first_login_shown';

/**
 * Hook to manage first-time user onboarding
 * Shows welcome onboarding ONLY once after first signup
 * Uses localStorage for persistence across sessions
 */
export const useNewUserOnboarding = () => {
  const { user, session } = useAuth();
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (!user || !session) {
      setShouldShowWelcome(false);
      return;
    }

    // Check if user is new (created within last 60 seconds)
    const createdAt = new Date(user.created_at || 0).getTime();
    const now = Date.now();
    const isRecent = (now - createdAt) < 60000; // Within 60 seconds = new registration

    // Check if onboarding was already shown
    const alreadyShown = localStorage.getItem(ONBOARDING_SHOWN_KEY) === 'true';

    if (isRecent && !alreadyShown) {
      setIsNewUser(true);
      setShouldShowWelcome(true);
    } else {
      setIsNewUser(false);
      setShouldShowWelcome(false);
    }
  }, [user, session]);

  const markOnboardingComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
    setShouldShowWelcome(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_SHOWN_KEY);
  }, []);

  return {
    shouldShowWelcome,
    isNewUser,
    markOnboardingComplete,
    resetOnboarding,
  };
};
