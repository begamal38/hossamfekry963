import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

const ONBOARDING_SHOWN_KEY = 'onboarding_welcome_shown';
const PROFILE_COMPLETE_KEY = 'profile_completion_done';

/**
 * Hook to manage first-time user onboarding
 * Shows welcome onboarding ONCE after first successful profile completion
 * Independent of signup method (Google / Manual)
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

    // Check if welcome was already shown
    const alreadyShown = localStorage.getItem(ONBOARDING_SHOWN_KEY) === 'true';
    
    if (alreadyShown) {
      setShouldShowWelcome(false);
      setIsNewUser(false);
      return;
    }

    // Check if profile is complete and welcome should be shown
    const checkProfileAndShowWelcome = async () => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, grade, language_track, governorate, phone')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!profile) {
          // No profile yet - don't show welcome
          setShouldShowWelcome(false);
          return;
        }

        // Check if profile is complete (all required fields filled)
        const isProfileComplete = 
          profile.full_name && profile.full_name.trim() !== '' &&
          profile.grade &&
          profile.language_track &&
          profile.governorate &&
          profile.phone && profile.phone.trim() !== '';

        // Only show welcome if:
        // 1. Profile is complete
        // 2. Welcome hasn't been shown before
        // 3. Profile was just completed (marked in this session)
        const justCompletedProfile = localStorage.getItem(PROFILE_COMPLETE_KEY) === 'true';

        if (isProfileComplete && !alreadyShown && justCompletedProfile) {
          setIsNewUser(true);
          setShouldShowWelcome(true);
          // Clear the profile complete flag after showing
          localStorage.removeItem(PROFILE_COMPLETE_KEY);
        } else if (isProfileComplete && !alreadyShown) {
          // Profile was already complete on login (existing user with complete profile)
          // Check if user was created recently (within last 5 minutes) - catch new signups
          const createdAt = new Date(user.created_at || 0).getTime();
          const now = Date.now();
          const isRecentUser = (now - createdAt) < 300000; // 5 minutes

          if (isRecentUser) {
            setIsNewUser(true);
            setShouldShowWelcome(true);
          } else {
            // Not a new user, don't show welcome
            setShouldShowWelcome(false);
          }
        } else {
          setShouldShowWelcome(false);
        }
      } catch (error) {
        console.error('Error checking profile for onboarding:', error);
        setShouldShowWelcome(false);
      }
    };

    checkProfileAndShowWelcome();
  }, [user, session]);

  const markOnboardingComplete = useCallback(() => {
    localStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
    setShouldShowWelcome(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(ONBOARDING_SHOWN_KEY);
    localStorage.removeItem(PROFILE_COMPLETE_KEY);
  }, []);

  // Call this after successful profile completion to trigger welcome
  const triggerWelcomeAfterProfileComplete = useCallback(() => {
    localStorage.setItem(PROFILE_COMPLETE_KEY, 'true');
    setIsNewUser(true);
    setShouldShowWelcome(true);
  }, []);

  return {
    shouldShowWelcome,
    isNewUser,
    markOnboardingComplete,
    resetOnboarding,
    triggerWelcomeAfterProfileComplete,
  };
};
