import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
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

const ProfileCompletionCheck = ({ children }: ProfileCompletionCheckProps) => {
  const { user } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const [missingFields, setMissingFields] = useState<MissingFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const checkProfileCompletion = useCallback(async (retryCount = 0) => {
    if (!user || roleLoading) {
      setLoading(false);
      return;
    }

    // Only check profile completion for students
    if (!isStudent()) {
      setMissingFields(null);
      setLoading(false);
      setHasChecked(true);
      return;
    }

    try {
      // Fetch profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, grade, language_track, governorate, phone, attendance_mode')
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
      // This handles the edge case where the trigger hasn't fired yet
      if (!data) {
        const allMissing: MissingFields = {
          full_name: true,
          grade: true,
          language_track: true,
          governorate: true,
          phone: true,
          attendance_mode: true,
          center_group: false, // Can't know if needed yet
        };
        setMissingFields(allMissing);
        setLoading(false);
        setHasChecked(true);
        return;
      }

      // Check center group membership if attendance_mode = center
      let hasCenterGroup = true;
      if (data.attendance_mode === 'center') {
        const { data: membership } = await supabase
          .from('center_group_members')
          .select('id')
          .eq('student_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        hasCenterGroup = !!membership;
      }

      // Check which fields are missing
      const missing: MissingFields = {
        full_name: !data.full_name || data.full_name.trim() === '',
        grade: !data.grade,
        language_track: !data.language_track,
        governorate: !data.governorate,
        phone: !data.phone || data.phone.trim() === '',
        attendance_mode: !data.attendance_mode,
        center_group: data.attendance_mode === 'center' && !hasCenterGroup,
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

  const handleProfileComplete = () => {
    setMissingFields(null);
  };

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
