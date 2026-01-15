import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export function useAvailableExamsCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      setLoading(false);
      return;
    }

    try {
      // Get enrolled courses
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!enrollments?.length) {
        setCount(0);
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map(e => e.course_id);

      // Get published exams for enrolled courses
      const { data: exams } = await supabase
        .from('exams')
        .select('id, max_attempts')
        .eq('status', 'published')
        .in('course_id', courseIds);

      if (!exams?.length) {
        setCount(0);
        setLoading(false);
        return;
      }

      // Get user's completed attempts
      const { data: attempts } = await supabase
        .from('exam_attempts')
        .select('exam_id, is_completed')
        .eq('user_id', user.id)
        .eq('is_completed', true)
        .in('exam_id', exams.map(e => e.id));

      // Count exams that user hasn't completed or can retry
      const attemptsByExam = new Map<string, number>();
      attempts?.forEach(a => {
        attemptsByExam.set(a.exam_id, (attemptsByExam.get(a.exam_id) || 0) + 1);
      });

      const availableCount = exams.filter(exam => {
        const userAttempts = attemptsByExam.get(exam.id) || 0;
        // Exam is available if user hasn't attempted or has attempts remaining
        if (userAttempts === 0) return true;
        if (exam.max_attempts && userAttempts < exam.max_attempts) return true;
        return false;
      }).length;

      setCount(availableCount);
    } catch (error) {
      console.error('Error fetching available exams count:', error);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  return { count, loading, refetch: fetchCount };
}
