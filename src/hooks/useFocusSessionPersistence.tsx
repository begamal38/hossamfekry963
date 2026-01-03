import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FocusSessionData {
  lessonId: string;
  courseId: string;
  startedAt: number;
  totalActiveSeconds: number;
  totalPausedSeconds: number;
  interruptions: number;
  completedSegments: number;
  isCompleted: boolean;
}

export const useFocusSessionPersistence = () => {
  // Save focus session to database
  const saveFocusSession = useCallback(async (
    userId: string,
    sessionData: FocusSessionData
  ) => {
    try {
      const { error } = await supabase
        .from('focus_sessions')
        .insert({
          user_id: userId,
          lesson_id: sessionData.lessonId,
          course_id: sessionData.courseId,
          started_at: new Date(sessionData.startedAt).toISOString(),
          ended_at: new Date().toISOString(),
          total_active_seconds: Math.round(sessionData.totalActiveSeconds),
          total_paused_seconds: Math.round(sessionData.totalPausedSeconds),
          interruptions: sessionData.interruptions,
          completed_segments: sessionData.completedSegments,
          is_completed: sessionData.isCompleted,
        });

      if (error) {
        console.error('Error saving focus session:', error);
        return false;
      }

      console.log('Focus session saved successfully');
      return true;
    } catch (err) {
      console.error('Failed to save focus session:', err);
      return false;
    }
  }, []);

  return { saveFocusSession };
};
