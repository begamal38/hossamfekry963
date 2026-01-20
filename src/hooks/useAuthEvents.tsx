/**
 * Auth Events Hook - Side Effects Only
 * 
 * Separated from AuthProvider to keep auth state pure.
 * Handles: Google OAuth analytics, welcome email triggers.
 * 
 * ARCHITECTURE NOTE:
 * AuthProvider → pure auth state (user, session, loading)
 * useAuthEvents → side effects (analytics, emails, cache)
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export const useAuthEvents = (session: Session | null) => {
  // Track if we've already processed this session to prevent duplicate effects
  const processedSessionIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!session?.user) {
      processedSessionIdRef.current = null;
      return;
    }

    // Skip if we already processed this exact session
    const sessionKey = `${session.user.id}-${session.access_token?.slice(-8)}`;
    if (processedSessionIdRef.current === sessionKey) return;
    
    processedSessionIdRef.current = sessionKey;

    // Detect Google OAuth login/registration
    const provider = session.user.app_metadata?.provider;
    if (provider === 'google') {
      const createdAt = new Date(session.user.created_at || 0).getTime();
      const now = Date.now();
      const isNewUser = (now - createdAt) < 15000; // Within 15 seconds = new registration

      if (isNewUser) {
        // New Google registration - log analytics event
        console.log('[AuthEvents] google_register_success', { 
          user_id: session.user.id,
          timestamp: now 
        });
        
        // Welcome email for new Google users is handled by database trigger
        // No additional action needed here
      } else {
        // Returning Google login
        console.log('[AuthEvents] google_login_success', { 
          user_id: session.user.id,
          timestamp: now 
        });
      }
    }
  }, [session]);
};

/**
 * Unified Cache Clearing Strategy
 * 
 * Called on sign out to ensure clean state.
 * Prevents stale data from persisting across sessions.
 */
export const clearAllAuthCaches = () => {
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

/**
 * Central Cache Invalidation Events
 * 
 * Call these after specific events to ensure data consistency.
 */
export const invalidateOnLessonComplete = () => {
  try {
    const { clearEnrollmentsCache } = require('./useEnrollments');
    clearEnrollmentsCache?.(); // Progress changed
  } catch { /* ignore */ }
};

export const invalidateOnEnrollmentChange = () => {
  try {
    const { clearEnrollmentsCache } = require('./useEnrollments');
    clearEnrollmentsCache?.();
  } catch { /* ignore */ }
};

export const invalidateOnExamComplete = () => {
  try {
    const { clearEnrollmentsCache } = require('./useEnrollments');
    clearEnrollmentsCache?.();
  } catch { /* ignore */ }
};
