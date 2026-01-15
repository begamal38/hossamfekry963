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
}

const ProfileCompletionCheck = ({ children }: ProfileCompletionCheckProps) => {
  const { user } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const [missingFields, setMissingFields] = useState<MissingFields | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  const checkProfileCompletion = useCallback(async () => {
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
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, grade, language_track, governorate, phone')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      // Check which fields are missing
      const missing: MissingFields = {
        full_name: !data?.full_name || data.full_name.trim() === '',
        grade: !data?.grade,
        language_track: !data?.language_track,
        governorate: !data?.governorate,
        phone: !data?.phone || data.phone.trim() === '',
      };

      // If any required field is missing, show the prompt
      const hasMissingFields = Object.values(missing).some(v => v);
      setMissingFields(hasMissingFields ? missing : null);
    } catch (error) {
      console.error('Error checking profile completion:', error);
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
