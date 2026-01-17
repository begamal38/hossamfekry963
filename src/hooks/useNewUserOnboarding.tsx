import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

const ONBOARDING_SHOWN_KEY = 'onboarding_welcome_shown';

/**
 * Hook to manage first-time user onboarding
 * Shows welcome onboarding ONCE for every new user on first login
 * Independent of signup method (Google / Manual) or profile completion
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

    // Check if welcome was already shown for this user
    // Use user-specific key to support multiple accounts
    const userKey = `${ONBOARDING_SHOWN_KEY}_${user.id}`;
    const alreadyShown = localStorage.getItem(userKey) === 'true';
    
    if (alreadyShown) {
      setShouldShowWelcome(false);
      setIsNewUser(false);
      return;
    }

    // New user who hasn't seen welcome yet - show it!
    // This triggers for:
    // - Google Login (first time)
    // - Manual Signup (first time)
    // - Any signup method
    // Regardless of profile completion status
    setIsNewUser(true);
    setShouldShowWelcome(true);
  }, [user, session]);

  const markOnboardingComplete = useCallback(() => {
    if (!user) return;
    
    const userKey = `${ONBOARDING_SHOWN_KEY}_${user.id}`;
    localStorage.setItem(userKey, 'true');
    setShouldShowWelcome(false);
  }, [user]);

  const resetOnboarding = useCallback(() => {
    if (!user) return;
    
    const userKey = `${ONBOARDING_SHOWN_KEY}_${user.id}`;
    localStorage.removeItem(userKey);
  }, [user]);

  // Legacy function - kept for backwards compatibility but no longer needed
  const triggerWelcomeAfterProfileComplete = useCallback(() => {
    // No-op: Welcome now triggers automatically on first login
  }, []);

  return {
    shouldShowWelcome,
    isNewUser,
    markOnboardingComplete,
    resetOnboarding,
    triggerWelcomeAfterProfileComplete,
  };
};
