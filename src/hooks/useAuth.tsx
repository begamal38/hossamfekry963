import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Import cache clear functions (lazy to avoid circular deps)
const clearAllCaches = () => {
  try {
    // Clear role cache
    const { clearRoleCache } = require('./useUserRole');
    clearRoleCache?.();
  } catch { /* ignore */ }
  try {
    // Clear profile cache
    const { clearProfileCache } = require('./useProfile');
    clearProfileCache?.();
  } catch { /* ignore */ }
  try {
    // Clear enrollments cache
    const { clearEnrollmentsCache } = require('./useEnrollments');
    clearEnrollmentsCache?.();
  } catch { /* ignore */ }
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    phone?: string,
    academicYear?: string,
    languageTrack?: string,
    governorate?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Handle Google OAuth success events
        if (event === 'SIGNED_IN' && session?.user) {
          const provider = session.user.app_metadata?.provider;
          if (provider === 'google') {
            // Check if this is a new user (created_at === updated_at within 5 seconds)
            const createdAt = new Date(session.user.created_at || 0).getTime();
            const now = Date.now();
            const isNewUser = (now - createdAt) < 10000; // Within 10 seconds = new registration
            
            // Store event for analytics (silent)
            if (isNewUser) {
              console.log('google_register_success', { user_id: session.user.id, timestamp: now });
            } else {
              console.log('google_login_success', { user_id: session.user.id, timestamp: now });
            }
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string, academicYear?: string, languageTrack?: string, governorate?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    // Generate combined grade for backward compatibility
    const grade = academicYear && languageTrack 
      ? `${academicYear === 'second_secondary' ? 'second' : 'third'}_${languageTrack}`
      : undefined;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone,
          grade: grade,
          academic_year: academicYear,
          language_track: languageTrack,
          governorate: governorate,
        }
      }
    });

    // Send welcome email (non-blocking, fail silently)
    if (!error && data?.user) {
      supabase.functions.invoke('send-welcome-email', {
        body: {
          user_id: data.user.id,
          email: email,
          full_name: fullName,
        }
      }).catch(() => {
        // Fail silently - don't block registration
        console.log('Welcome email skipped');
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Send the user back to /auth so we can route them by role reliably
        redirectTo: `${window.location.origin}/auth`,
      }
    });
    return { error: error as Error | null };
  };

  const signOut = useCallback(async () => {
    // Clear all caches first
    clearAllCaches();

    // Clear local state so UI updates immediately
    setUser(null);
    setSession(null);

    // Clear persisted auth tokens immediately so a page refresh can't restore an old session
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
          localStorage.removeItem(key);
        }
      }
    } catch {
      // ignore storage errors
    }

    // Best-effort server sign out (may fail if the session already expired)
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }, []);

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
