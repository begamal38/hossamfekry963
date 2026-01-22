import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

const ONBOARDING_SHOWN_KEY = 'onboarding_welcome_shown';
const PROFILE_COMPLETE_KEY = 'profile_completion_done';

/**
 * Hook to manage first-time user onboarding
 * Shows welcome onboarding ONCE EVER per user AFTER profile is complete
 * 
 * CRITICAL LOGIC:
 * 1. Profile completion modal appears FIRST (if fields missing)
 * 2. Welcome onboarding appears ONLY AFTER profile is 100% complete
 * 3. Once shown and dismissed, NEVER shows again (even after logout/login)
 */
export const useNewUserOnboarding = () => {
  const { user, session } = useAuth();
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
  
  // Guard to prevent re-triggering during the same session
  const hasTriggeredThisSession = useRef(false);

  // Check if profile is complete
  const checkProfileCompletion = useCallback(async () => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, grade, language_track, governorate, phone, attendance_mode')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error || !data) return false;

      // Basic fields check
      const hasBasicFields = Boolean(
        data.full_name?.trim() &&
        data.grade &&
        data.language_track &&
        data.governorate &&
        data.phone?.trim() &&
        data.attendance_mode
      );

      if (!hasBasicFields) return false;

      // For center students, verify they have active group membership
      if (data.attendance_mode === 'center') {
        const { data: membership } = await supabase
          .from('center_group_members')
          .select('id')
          .eq('student_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        return Boolean(membership);
      }

      return true;
    } catch {
      return false;
    }
  }, [user]);

  useEffect(() => {
    if (!user || !session) {
      setShouldShowWelcome(false);
      setProfileComplete(null);
      hasTriggeredThisSession.current = false;
      return;
    }

    const userKey = `${ONBOARDING_SHOWN_KEY}_${user.id}`;
    const profileKey = `${PROFILE_COMPLETE_KEY}_${user.id}`;
    
    // CRITICAL: Check if already shown (stored permanently in localStorage)
    const alreadyShown = localStorage.getItem(userKey) === 'true';
    
    if (alreadyShown) {
      // NEVER show again if already dismissed
      setShouldShowWelcome(false);
      setIsNewUser(false);
      setProfileComplete(true);
      return;
    }

    // Guard: Don't re-trigger if already processed this session
    if (hasTriggeredThisSession.current) {
      return;
    }

    // Mark as new user (hasn't seen onboarding yet)
    setIsNewUser(true);

    // Check if profile was marked as complete
    const profileWasCompleted = localStorage.getItem(profileKey) === 'true';
    
    if (profileWasCompleted) {
      // Profile is complete, can show welcome
      setShouldShowWelcome(true);
      setProfileComplete(true);
      hasTriggeredThisSession.current = true;
    } else {
      // Check profile status from DB
      checkProfileCompletion().then((isComplete) => {
        setProfileComplete(isComplete);
        if (isComplete) {
          // Profile is complete in DB, mark it and show welcome
          localStorage.setItem(profileKey, 'true');
          setShouldShowWelcome(true);
          hasTriggeredThisSession.current = true;
        } else {
          // Profile incomplete - DO NOT show welcome
          // ProfileCompletionPrompt will handle this
          setShouldShowWelcome(false);
        }
      });
    }
  }, [user, session, checkProfileCompletion]);

  const markOnboardingComplete = useCallback(() => {
    if (!user) return;
    
    const userKey = `${ONBOARDING_SHOWN_KEY}_${user.id}`;
    localStorage.setItem(userKey, 'true');
    setShouldShowWelcome(false);
  }, [user]);

  const resetOnboarding = useCallback(() => {
    if (!user) return;
    
    const userKey = `${ONBOARDING_SHOWN_KEY}_${user.id}`;
    const profileKey = `${PROFILE_COMPLETE_KEY}_${user.id}`;
    localStorage.removeItem(userKey);
    localStorage.removeItem(profileKey);
  }, [user]);

  /**
   * CRITICAL: Called by ProfileCompletionPrompt after successful save
   * This triggers the welcome onboarding after profile is 100% complete
   */
  const triggerWelcomeAfterProfileComplete = useCallback(() => {
    if (!user) return;
    
    const profileKey = `${PROFILE_COMPLETE_KEY}_${user.id}`;
    localStorage.setItem(profileKey, 'true');
    setProfileComplete(true);
    
    // Small delay to let profile modal close first
    setTimeout(() => {
      setShouldShowWelcome(true);
    }, 500);
  }, [user]);

  return {
    shouldShowWelcome,
    isNewUser,
    profileComplete,
    markOnboardingComplete,
    resetOnboarding,
    triggerWelcomeAfterProfileComplete,
  };
};
