/**
 * Optimized Chapter Progress Hook
 * 
 * Uses the new RPC function `get_chapter_progress` for single-query performance.
 * Replaces the previous 5+ sequential queries approach.
 * 
 * ARCHITECTURE:
 * - Single RPC call returns all chapter data
 * - Proper caching to prevent redundant fetches
 * - Maintains backward compatibility with existing API
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ChapterProgressData {
  chapterId: string;
  chapterTitle: string;
  chapterTitleAr: string;
  orderIndex: number;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  isComplete: boolean;
  hasExam: boolean;
  examId: string | null;
  examTitle: string | null;
  examTitleAr: string | null;
  examCompleted: boolean;
  examScore: number;
}

interface UseChapterProgressOptimizedReturn {
  chapters: ChapterProgressData[];
  loading: boolean;
  error: Error | null;
  isChapterComplete: (chapterId: string) => boolean;
  canAccessChapterExam: (chapterId: string) => boolean;
  hasCompletedExam: (chapterId: string) => boolean;
  getChapterProgress: (chapterId: string) => ChapterProgressData | null;
  refetch: () => Promise<void>;
}

// In-memory cache
let progressCache: { 
  key: string; 
  data: ChapterProgressData[]; 
  fetchedAt: number 
} | null = null;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

export const clearChapterProgressCache = () => {
  progressCache = null;
};

export function useChapterProgressOptimized(courseId: string): UseChapterProgressOptimizedReturn {
  const { user } = useAuth();
  const [chapters, setChapters] = useState<ChapterProgressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!courseId) {
      setLoading(false);
      return;
    }

    // Check cache
    const cacheKey = `${courseId}-${user?.id || 'anon'}`;
    const cached = progressCache?.key === cacheKey ? progressCache : null;
    const cacheFresh = cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS;

    if (cacheFresh) {
      setChapters(cached.data);
      setLoading(false);
      return;
    }

    // Use stale data while refreshing
    if (cached) {
      setChapters(cached.data);
    }

    try {
      // Single RPC call for all chapter progress data
      const { data, error: rpcError } = await supabase
        .rpc('get_chapter_progress', {
          p_course_id: courseId,
          p_user_id: user?.id || null,
        });

      if (rpcError) throw rpcError;

      const mappedData: ChapterProgressData[] = (data || []).map((row: any) => ({
        chapterId: row.chapter_id,
        chapterTitle: row.chapter_title,
        chapterTitleAr: row.chapter_title_ar,
        orderIndex: row.order_index,
        totalLessons: row.total_lessons,
        completedLessons: row.completed_lessons,
        progressPercent: row.progress_percent,
        isComplete: row.is_complete,
        hasExam: row.has_exam,
        examId: row.exam_id,
        examTitle: row.exam_title,
        examTitleAr: row.exam_title_ar,
        examCompleted: row.exam_completed,
        examScore: row.exam_score,
      }));

      // Update cache
      progressCache = { key: cacheKey, data: mappedData, fetchedAt: Date.now() };
      setChapters(mappedData);
      setError(null);
    } catch (err) {
      console.error('Error fetching chapter progress:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoized lookup functions
  const chaptersMap = useMemo(() => 
    new Map(chapters.map(c => [c.chapterId, c])), 
    [chapters]
  );

  const isChapterComplete = useCallback((chapterId: string): boolean => {
    return chaptersMap.get(chapterId)?.isComplete ?? false;
  }, [chaptersMap]);

  const canAccessChapterExam = useCallback((chapterId: string): boolean => {
    const chapter = chaptersMap.get(chapterId);
    return !!(chapter?.hasExam && chapter.isComplete);
  }, [chaptersMap]);

  const hasCompletedExam = useCallback((chapterId: string): boolean => {
    return chaptersMap.get(chapterId)?.examCompleted ?? false;
  }, [chaptersMap]);

  const getChapterProgress = useCallback((chapterId: string): ChapterProgressData | null => {
    return chaptersMap.get(chapterId) || null;
  }, [chaptersMap]);

  return {
    chapters,
    loading,
    error,
    isChapterComplete,
    canAccessChapterExam,
    hasCompletedExam,
    getChapterProgress,
    refetch: fetchData,
  };
}
