import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import GovernoratePrompt from './GovernoratePrompt';

interface GovernorateCheckProps {
  children: React.ReactNode;
}

const GovernorateCheck = ({ children }: GovernorateCheckProps) => {
  const { user } = useAuth();
  const [needsGovernorate, setNeedsGovernorate] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkGovernorate = async () => {
      if (!user) {
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
  }, [user]);

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
