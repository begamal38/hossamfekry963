import { useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Generate a unique session ID for visitors
const getSessionId = (): string => {
  const key = 'visitor_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem(key, sessionId);
  }
  
  return sessionId;
};

interface UseFreeAnalyticsReturn {
  trackView: (lessonId: string) => Promise<string | null>;
  updatePreviewTime: (analyticsId: string, seconds: number) => Promise<void>;
  markCompleted: (analyticsId: string) => Promise<void>;
  trackEnrollment: (analyticsId: string) => Promise<void>;
}

/**
 * Hook for tracking free lesson analytics
 * Tracks: preview time, views, completions, and enrollment conversion
 */
export const useFreeAnalytics = (): UseFreeAnalyticsReturn => {
  const { user } = useAuth();
  const sessionId = useRef<string>(getSessionId());

  // Track a new view
  const trackView = useCallback(async (lessonId: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('free_lesson_analytics')
        .insert({
          lesson_id: lessonId,
          session_id: sessionId.current,
          user_id: user?.id || null,
        })
        .select('id')
        .single();

      if (error) {
        console.warn('Failed to track free lesson view:', error);
        return null;
      }

      return data?.id || null;
    } catch (err) {
      console.warn('Error tracking view:', err);
      return null;
    }
  }, [user?.id]);

  // Update preview time
  const updatePreviewTime = useCallback(async (analyticsId: string, seconds: number): Promise<void> => {
    if (!analyticsId) return;

    try {
      await supabase
        .from('free_lesson_analytics')
        .update({
          preview_seconds: seconds,
          view_ended_at: new Date().toISOString(),
        })
        .eq('id', analyticsId);
    } catch (err) {
      console.warn('Error updating preview time:', err);
    }
  }, []);

  // Mark lesson as completed
  const markCompleted = useCallback(async (analyticsId: string): Promise<void> => {
    if (!analyticsId) return;

    try {
      await supabase
        .from('free_lesson_analytics')
        .update({
          is_completed: true,
          view_ended_at: new Date().toISOString(),
        })
        .eq('id', analyticsId);
    } catch (err) {
      console.warn('Error marking completed:', err);
    }
  }, []);

  // Track enrollment conversion
  const trackEnrollment = useCallback(async (analyticsId: string): Promise<void> => {
    if (!analyticsId) return;

    try {
      await supabase
        .from('free_lesson_analytics')
        .update({
          enrolled_at: new Date().toISOString(),
          user_id: user?.id || null,
        })
        .eq('id', analyticsId);
    } catch (err) {
      console.warn('Error tracking enrollment:', err);
    }
  }, [user?.id]);

  return {
    trackView,
    updatePreviewTime,
    markCompleted,
    trackEnrollment,
  };
};
