import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LessonProgress {
  lessonId: string;
  isCompleted: boolean;
  completedAt: string | null;
  watchTimeSeconds: number;
}

interface UseLessonProgressReturn {
  completions: Record<string, LessonProgress>;
  isLessonCompleted: (lessonId: string) => boolean;
  markLessonComplete: (lessonId: string) => Promise<void>;
  canAccessLesson: (
    lessonId: string,
    lessonOrderIndex: number,
    lessons: Array<{ id: string; order_index: number; requires_previous_completion: boolean }>
  ) => boolean;
  loading: boolean;
}

export function useLessonProgress(courseId: string): UseLessonProgressReturn {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<Record<string, LessonProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletions = async () => {
      if (!user || !courseId) {
        setLoading(false);
        return;
      }

      try {
        // Get lessons for this course
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id')
          .eq('course_id', courseId);

        if (!lessons || lessons.length === 0) {
          setLoading(false);
          return;
        }

        const lessonIds = lessons.map(l => l.id);

        // Get completions for these lessons
        const { data: completionsData, error } = await supabase
          .from('lesson_completions')
          .select('*')
          .eq('user_id', user.id)
          .in('lesson_id', lessonIds);

        if (error) throw error;

        const completionsMap: Record<string, LessonProgress> = {};
        (completionsData || []).forEach(c => {
          completionsMap[c.lesson_id] = {
            lessonId: c.lesson_id,
            isCompleted: true,
            completedAt: c.completed_at,
            watchTimeSeconds: c.watch_time_seconds || 0,
          };
        });

        setCompletions(completionsMap);
      } catch (error) {
        console.error('Error fetching lesson completions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletions();
  }, [user, courseId]);

  const isLessonCompleted = useCallback((lessonId: string): boolean => {
    return !!completions[lessonId]?.isCompleted;
  }, [completions]);

  /**
   * Mark a lesson as complete - STUDENTS ONLY
   * 
   * CRITICAL DATA HYGIENE: This function should only be called for students.
   * Staff testing/observation MUST NOT create lesson_completions records.
   * The isStaff parameter allows callers to block staff writes.
   */
  const markLessonComplete = useCallback(async (lessonId: string, isStaff: boolean = false) => {
    if (!user) return;

    // ═══════════════════════════════════════════════════════════════════
    // ROLE GUARD: Staff MUST NOT write lesson completions
    // This prevents analytics contamination from testing/observation
    // ═══════════════════════════════════════════════════════════════════
    if (isStaff) {
      console.log('[LessonProgress] Blocked: Staff user - not recording completion');
      return;
    }

    try {
      const { error } = await supabase
        .from('lesson_completions')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,lesson_id',
        });

      if (error) throw error;

      setCompletions(prev => ({
        ...prev,
        [lessonId]: {
          lessonId,
          isCompleted: true,
          completedAt: new Date().toISOString(),
          watchTimeSeconds: 0,
        },
      }));
    } catch (error) {
      console.error('Error marking lesson complete:', error);
    }
  }, [user]);

  const canAccessLesson = useCallback((
    lessonId: string,
    lessonOrderIndex: number,
    lessons: Array<{ id: string; order_index: number; requires_previous_completion: boolean }>
  ): boolean => {
    // Find the lesson
    const lesson = lessons.find(l => l.id === lessonId);
    if (!lesson) return false;

    // If lesson doesn't require previous completion, it's accessible
    if (!lesson.requires_previous_completion) return true;

    // If it's the first lesson, it's always accessible
    if (lessonOrderIndex === 0) return true;

    // Find the previous lesson
    const sortedLessons = [...lessons].sort((a, b) => a.order_index - b.order_index);
    const currentIndex = sortedLessons.findIndex(l => l.id === lessonId);
    
    if (currentIndex <= 0) return true;

    const previousLesson = sortedLessons[currentIndex - 1];
    return isLessonCompleted(previousLesson.id);
  }, [isLessonCompleted]);

  return {
    completions,
    isLessonCompleted,
    markLessonComplete,
    canAccessLesson,
    loading,
  };
}
