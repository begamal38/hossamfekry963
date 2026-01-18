import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface SessionState {
  sessionActive: boolean;
}

// Generate a unique session token
const generateSessionToken = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

export const useSessionProtection = () => {
  const { user } = useAuth();
  
  const [sessionState, setSessionState] = useState<SessionState>({
    sessionActive: false
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const sessionTokenRef = useRef<string | null>(null);

  // Create new session (simplified - no device tracking)
  const createSession = useCallback(async (userId: string): Promise<string | null> => {
    try {
      const sessionToken = generateSessionToken();

      const { error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          session_token: sessionToken,
          is_active: true
        });

      if (error) {
        console.error('Error creating session:', error);
        return null;
      }

      return sessionToken;
    } catch (error) {
      console.error('Error in createSession:', error);
      return null;
    }
  }, []);

  // End current session on logout
  const endCurrentSession = useCallback(async () => {
    if (!sessionTokenRef.current) return;

    try {
      await supabase
        .from('user_sessions')
        .update({
          is_active: false,
          ended_at: new Date().toISOString(),
          ended_reason: 'logout'
        })
        .eq('session_token', sessionTokenRef.current);
    } catch (error) {
      console.error('Error ending session:', error);
    }
  }, []);

  // Initialize session (simplified - no device restrictions)
  useEffect(() => {
    const initializeSession = async () => {
      if (!user) {
        setIsInitialized(true);
        return;
      }

      // Create session
      const sessionToken = await createSession(user.id);
      sessionTokenRef.current = sessionToken;

      setSessionState({ sessionActive: !!sessionToken });
      setIsInitialized(true);
    };

    if (user) {
      initializeSession();
    } else {
      setIsInitialized(true);
    }
  }, [user, createSession]);

  // Cleanup on logout/close (best-effort)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionTokenRef.current) {
        navigator.sendBeacon && navigator.sendBeacon(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_sessions?session_token=eq.${sessionTokenRef.current}`,
          JSON.stringify({ is_active: false, ended_at: new Date().toISOString(), ended_reason: 'closed' })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return {
    sessionState,
    isInitialized,
    endCurrentSession
  };
};
