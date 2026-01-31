import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ChapterProgress {
  chapterId: string;
  totalLessons: number;
  completedLessons: number;
  isComplete: boolean;
  progressPercent: number;
}

interface ChapterExam {
  id: string;
  title: string;
  title_ar: string;
  chapter_id: string;
  status: string;
}

interface ExamAttempt {
  exam_id: string;
  score: number;
  total_questions: number;
  is_completed: boolean;
}

interface UseChapterProgressReturn {
  chapterProgress: Record<string, ChapterProgress>;
  chapterExams: Record<string, ChapterExam>;
  examAttempts: Record<string, ExamAttempt>;
  isChapterComplete: (chapterId: string) => boolean;
  canAccessChapterExam: (chapterId: string) => boolean;
  hasCompletedExam: (chapterId: string) => boolean;
  getChapterProgress: (chapterId: string) => ChapterProgress | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useChapterProgress(courseId: string): UseChapterProgressReturn {
  const { user } = useAuth();
  const [chapterProgress, setChapterProgress] = useState<Record<string, ChapterProgress>>({});
  const [chapterExams, setChapterExams] = useState<Record<string, ChapterExam>>({});
  const [examAttempts, setExamAttempts] = useState<Record<string, ExamAttempt>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    // Extract userId once for stable reference
    const userId = user?.id;

    try {
      // Fetch all chapters for this course
      const { data: chapters } = await supabase
        .from('chapters')
        .select('id')
        .eq('course_id', courseId);

      if (!chapters || chapters.length === 0) {
        setLoading(false);
        return;
      }

      const chapterIds = chapters.map(c => c.id);

      // Fetch all lessons for this course
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, chapter_id')
        .eq('course_id', courseId)
        .not('chapter_id', 'is', null);

      // Fetch all exams linked to chapters in this course
      const { data: exams } = await supabase
        .from('exams')
        .select('id, title, title_ar, chapter_id, status')
        .in('chapter_id', chapterIds)
        .eq('status', 'published');

      // Build exams map
      const examsMap: Record<string, ChapterExam> = {};
      (exams || []).forEach(exam => {
        if (exam.chapter_id) {
          examsMap[exam.chapter_id] = exam;
        }
      });
      setChapterExams(examsMap);

      // Fetch user's lesson completions if logged in
      let completedLessonIds: Set<string> = new Set();
      let attemptsMap: Record<string, ExamAttempt> = {};

      if (userId) {
        const lessonIds = (lessons || []).map(l => l.id);
        
        if (lessonIds.length > 0) {
          const { data: completions } = await supabase
            .from('lesson_completions')
            .select('lesson_id')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds);

          completedLessonIds = new Set((completions || []).map(c => c.lesson_id));
        }

        // Fetch user's exam attempts for chapter exams
        const examIds = (exams || []).map(e => e.id);
        if (examIds.length > 0) {
          const { data: attempts } = await supabase
            .from('exam_attempts')
            .select('exam_id, score, total_questions, is_completed')
            .eq('user_id', userId)
            .eq('is_completed', true)
            .in('exam_id', examIds);

          (attempts || []).forEach(attempt => {
            // Map by chapter_id for easy lookup
            const exam = (exams || []).find(e => e.id === attempt.exam_id);
            if (exam?.chapter_id) {
              attemptsMap[exam.chapter_id] = attempt;
            }
          });
        }
      }

      setExamAttempts(attemptsMap);

      // Calculate progress per chapter
      const progressMap: Record<string, ChapterProgress> = {};
      
      chapterIds.forEach(chapterId => {
        const chapterLessons = (lessons || []).filter(l => l.chapter_id === chapterId);
        const completedCount = chapterLessons.filter(l => completedLessonIds.has(l.id)).length;
        const totalCount = chapterLessons.length;
        
        progressMap[chapterId] = {
          chapterId,
          totalLessons: totalCount,
          completedLessons: completedCount,
          isComplete: totalCount > 0 && completedCount >= totalCount,
          progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        };
      });

      setChapterProgress(progressMap);
    } catch (error) {
      console.error('Error fetching chapter progress:', error);
    } finally {
      setLoading(false);
    }
  // STABLE DEPS: Use user?.id instead of user object to prevent reference instability
  }, [courseId, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isChapterComplete = useCallback((chapterId: string): boolean => {
    return chapterProgress[chapterId]?.isComplete ?? false;
  }, [chapterProgress]);

  const canAccessChapterExam = useCallback((chapterId: string): boolean => {
    // Exam is accessible only if:
    // 1. Chapter has an exam
    // 2. All lessons in chapter are completed
    const hasExam = !!chapterExams[chapterId];
    const isComplete = isChapterComplete(chapterId);
    return hasExam && isComplete;
  }, [chapterExams, isChapterComplete]);

  const hasCompletedExam = useCallback((chapterId: string): boolean => {
    return !!examAttempts[chapterId];
  }, [examAttempts]);

  const getChapterProgress = useCallback((chapterId: string): ChapterProgress | null => {
    return chapterProgress[chapterId] || null;
  }, [chapterProgress]);

  return {
    chapterProgress,
    chapterExams,
    examAttempts,
    isChapterComplete,
    canAccessChapterExam,
    hasCompletedExam,
    getChapterProgress,
    loading,
    refetch: fetchData,
  };
}
