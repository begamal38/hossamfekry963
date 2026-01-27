import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { attemptSilentProfileFix } from '@/lib/silentProfileAutoFix';
import ProfileCompletionPrompt from './ProfileCompletionPrompt';

interface ProfileCompletionCheckProps {
  children: React.ReactNode;
}

interface MissingFields {
  grade: boolean;
  language_track: boolean;
  governorate: boolean;
  phone: boolean;
  full_name: boolean;
  attendance_mode: boolean;
  center_group: boolean; // Required only when attendance_mode = center
}

// Session-level flag to prevent re-triggering after successful completion
const COMPLETION_SUCCESS_KEY = 'profile_completion_success';

const ProfileCompletionCheck = ({ children }: ProfileCompletionCheckProps) => {
  const { user } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const [missingFields, setMissingFields] = useState<MissingFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);
  
  // Guard: If completion was just done this session, don't re-check
  const completedThisSession = useRef(false);

  const checkProfileCompletion = useCallback(async (retryCount = 0) => {
    if (!user || roleLoading) {
      setLoading(false);
      return;
    }

    // GUARD: If already completed this session, skip check entirely
    // BUT this flag is ONLY set after successful DB verification
    if (completedThisSession.current) {
      setMissingFields(null);
      setLoading(false);
      setHasChecked(true);
      return;
    }

    // Only check profile completion for students
    if (!isStudent()) {
      setMissingFields(null);
      setLoading(false);
      setHasChecked(true);
      return;
    }

    // ========== SILENT AUTO-FIX LAYER ==========
    // Attempt to fix any inconsistencies BEFORE checking for missing fields
    // This prevents unnecessary prompts for fixable issues
    try {
      const fixResult = await attemptSilentProfileFix(user.id);
      if (fixResult.fixed) {
        console.log('[ProfileCompletionCheck] Silent auto-fix applied:', fixResult.actions);
      }
      // If fix was successful and profile is now complete, skip the prompt check
      if (fixResult.fixed && !fixResult.stillIncomplete) {
        setMissingFields(null);
        setLoading(false);
        setHasChecked(true);
        return;
      }
    } catch (fixError) {
      console.warn('[ProfileCompletionCheck] Silent auto-fix failed:', fixError);
      // Continue with normal check - don't block on fix errors
    }
    // ========== END SILENT AUTO-FIX ==========
    
    // NOTE: SessionStorage check REMOVED intentionally.
    // Database is the SINGLE SOURCE OF TRUTH for study_mode_confirmed.
    // This ensures ALL unconfirmed online students are forced to re-verify.

    try {
      // Fetch profile data including study_mode_confirmed
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, grade, language_track, governorate, phone, attendance_mode, study_mode_confirmed')
        .eq('user_id', user.id)
        .maybeSingle();

      // If profile doesn't exist yet (can happen briefly after Google OAuth), retry
      if (!data && !error && retryCount < 3) {
        console.log('Profile not found, retrying in 1 second...', { retryCount });
        setTimeout(() => checkProfileCompletion(retryCount + 1), 1000);
        return;
      }

      if (error) {
        console.error('Error fetching profile:', error);
        // Don't block on error - just skip the check
        setMissingFields(null);
        setLoading(false);
        setHasChecked(true);
        return;
      }

      // If profile still doesn't exist after retries, create a placeholder for the prompt
      if (!data) {
        const allMissing: MissingFields = {
          full_name: true,
          grade: true,
          language_track: true,
          governorate: true,
          phone: true,
          attendance_mode: true,
          center_group: false,
        };
        setMissingFields(allMissing);
        setLoading(false);
        setHasChecked(true);
        return;
      }

      // CRITICAL: Check center group membership from center_group_members table
      // This is the SINGLE SOURCE OF TRUTH for center membership
      let hasCenterGroup = true;
      if (data.attendance_mode === 'center') {
        const { data: membership, error: membershipError } = await supabase
          .from('center_group_members')
          .select('id')
          .eq('student_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (membershipError) {
          console.error('Error checking center membership:', membershipError);
          // On error, assume they have a group to avoid false prompts
          hasCenterGroup = true;
        } else {
          hasCenterGroup = !!membership;
        }
      }

      // ========== LEGACY ONLINE DEFAULT FIX + HYBRID NORMALIZATION ==========
      // Check if this is a legacy student who needs to reconfirm their study mode:
      // 1. attendance_mode = 'online' AND study_mode_confirmed = false (legacy auto-assigned)
      // 2. attendance_mode = 'hybrid' (deprecated - needs to pick online or center)
      const isLegacyOnlineStudent = 
        data.attendance_mode === 'online' && 
        data.study_mode_confirmed !== true; // false or null
      
      const isLegacyHybridStudent = data.attendance_mode === 'hybrid';
      
      // ========== END LEGACY FIX ==========

      // Check which fields are missing
      const missing: MissingFields = {
        full_name: !data.full_name || data.full_name.trim() === '',
        grade: !data.grade,
        language_track: !data.language_track,
        governorate: !data.governorate,
        phone: !data.phone || data.phone.trim() === '',
        // LEGACY FIX: Force attendance_mode selection if:
        // 1. attendance_mode is null/missing, OR
        // 2. Student is a legacy online student who never explicitly chose, OR
        // 3. Student has legacy 'hybrid' mode (no longer supported)
        attendance_mode: !data.attendance_mode || isLegacyOnlineStudent || isLegacyHybridStudent,
        // hybrid students also treated as needing center_group reconfirmation if they pick center
        center_group: (data.attendance_mode === 'center' || isLegacyHybridStudent) && !hasCenterGroup,
      };

      // If any required field is missing, show the prompt
      const hasMissingFields = Object.values(missing).some(v => v);
      setMissingFields(hasMissingFields ? missing : null);
    } catch (error) {
      console.error('Error checking profile completion:', error);
      // Don't block authentication on profile check errors
      setMissingFields(null);
    } finally {
      setLoading(false);
      setHasChecked(true);
    }
  }, [user, roleLoading, isStudent]);

  useEffect(() => {
    // Reset check when user changes
    if (!hasChecked || (user && !loading)) {
      checkProfileCompletion();
    }
  }, [user, roleLoading, checkProfileCompletion, hasChecked, loading]);

  // Re-check when user signs in (especially for Google OAuth)
  useEffect(() => {
    if (user && hasChecked) {
      // Small delay to ensure profile data is synced after OAuth
      const timer = setTimeout(() => {
        checkProfileCompletion();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user?.id]); // Only trigger on user ID change

  const handleProfileComplete = useCallback(async () => {
    // CRITICAL: Re-verify from database before marking complete
    // This ensures we don't close the modal if the DB write failed silently
    if (user) {
      try {
        // Fetch fresh profile data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('attendance_mode, study_mode_confirmed')
          .eq('user_id', user.id)
          .maybeSingle();
        
        // If center student, verify membership exists
        if (profileData?.attendance_mode === 'center') {
          const { data: membership } = await supabase
            .from('center_group_members')
            .select('id')
            .eq('student_id', user.id)
            .eq('is_active', true)
            .maybeSingle();
          
          if (!membership) {
            console.error('handleProfileComplete: Center student missing group membership');
            // Don't close modal - force re-check
            checkProfileCompletion();
            return;
          }
        }
        
        // Verify study_mode_confirmed is true
        if (profileData?.study_mode_confirmed !== true) {
          console.error('handleProfileComplete: study_mode_confirmed is not true');
          checkProfileCompletion();
          return;
        }
      } catch (error) {
        console.error('handleProfileComplete verification failed:', error);
        // On error, still proceed to avoid blocking
      }
    }
    
    // Mark completion in session memory to prevent re-triggering
    completedThisSession.current = true;
    
    // Also mark in sessionStorage for page refresh resilience within same session
    try {
      if (user) {
        const successKey = `${COMPLETION_SUCCESS_KEY}_${user.id}`;
        sessionStorage.setItem(successKey, 'true');
      }
    } catch { /* sessionStorage may be blocked */ }
    
    setMissingFields(null);
  }, [user, checkProfileCompletion]);

  if (loading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {user && missingFields && (
        <ProfileCompletionPrompt 
          userId={user.id}
          missingFields={missingFields}
          onComplete={handleProfileComplete} 
        />
      )}
    </>
  );
};

export default ProfileCompletionCheck;
