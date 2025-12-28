import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import GovernoratePrompt from './GovernoratePrompt';

interface GovernorateCheckProps {
  children: React.ReactNode;
}

const GovernorateCheck = ({ children }: GovernorateCheckProps) => {
  const { user } = useAuth();
  const { isStudent, loading: roleLoading } = useUserRole();
  const [needsGovernorate, setNeedsGovernorate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGovernorate = async () => {
      if (!user || roleLoading) {
        setLoading(false);
        return;
      }

      // Only check governorate for students - assistant teachers don't need it
      if (!isStudent()) {
        setNeedsGovernorate(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('governorate')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setNeedsGovernorate(!data?.governorate);
      } catch (error) {
        console.error('Error checking governorate:', error);
        setNeedsGovernorate(false);
      } finally {
        setLoading(false);
      }
    };

    checkGovernorate();
  }, [user, roleLoading, isStudent]);

  const handleGovernorateComplete = () => {
    setNeedsGovernorate(false);
  };

  if (loading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {user && needsGovernorate && (
        <GovernoratePrompt 
          userId={user.id} 
          onComplete={handleGovernorateComplete} 
        />
      )}
    </>
  );
};

export default GovernorateCheck;
