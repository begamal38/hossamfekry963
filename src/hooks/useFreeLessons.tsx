/**
 * Free Lessons Hook
 * 
 * Single source of truth for free lessons visibility.
 * A lesson with is_free_lesson = true MUST appear in the free lessons list.
 * 
 * Rules:
 * - is_free_lesson = true is the ONLY condition for free lesson visibility
 * - Course-level flags (is_primary, is_free) do NOT affect lesson visibility
 * - Lessons must have valid video URLs to be shown
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidVideo } from '@/lib/contentVisibility';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export interface FreeLesson {
  id: string;
  short_id: number;
  title: string;
  title_ar: string;
  duration_minutes: number | null;
  video_url: string | null;
  course_id: string;
  is_free_lesson: boolean;
  courses?: {
    title_ar: string;
    title: string;
    grade: string;
    is_primary?: boolean;
  };
}

interface UseFreeLessonsOptions {
  filterByUserGrade?: boolean;
}

export function useFreeLessons(options: UseFreeLessonsOptions = {}) {
  const { filterByUserGrade = true } = options;
  const { user } = useAuth();
  const { isAdmin, isAssistantTeacher, loading: rolesLoading } = useUserRole();
  
  const [lessons, setLessons] = useState<FreeLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [userGrade, setUserGrade] = useState<string | null>(null);

  const isStaff = !rolesLoading && (isAdmin() || isAssistantTeacher());

  // Fetch user's grade for filtering (students only)
  useEffect(() => {
    const fetchUserGrade = async () => {
      if (!user || isStaff) {
        setUserGrade(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('grade')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setUserGrade(data?.grade || null);
    };
    
    fetchUserGrade();
  }, [user, isStaff]);

  /**
   * Fetch free lessons - SINGLE SOURCE OF TRUTH
   * 
   * The ONLY condition is: is_free_lesson = true
   * No course-level dependencies (is_primary, is_free)
   */
  const fetchFreeLessons = useCallback(async () => {
    setLoading(true);
    try {
      // Query lessons where is_free_lesson = true
      // Remove is_primary filter - free lessons are course-independent
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          short_id,
          title,
          title_ar,
          duration_minutes,
          video_url,
          course_id,
          is_free_lesson,
          courses (
            title_ar,
            title,
            grade,
            is_primary
          )
        `)
        .eq('is_free_lesson', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter to only show lessons with valid videos
      let validLessons = (data || []).filter(lesson => hasValidVideo(lesson.video_url));
      
      // ROLE-BASED FILTERING:
      // - Staff (admin/assistant): See ALL free lessons (no grade filter)
      // - Logged-in students: Filter by their grade (if filterByUserGrade is true)
      // - Guests (not logged in): See ALL free lessons
      if (filterByUserGrade && user && !isStaff && userGrade) {
        validLessons = validLessons.filter(lesson => 
          lesson.courses?.grade === userGrade
        );
      }
      
      setLessons(validLessons);
    } catch (error) {
      console.error('Error fetching free lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [user, isStaff, userGrade, filterByUserGrade]);

  // Fetch when dependencies are ready
  useEffect(() => {
    if (rolesLoading) return;
    fetchFreeLessons();
  }, [fetchFreeLessons, rolesLoading]);

  // Expose refetch for external cache invalidation
  const refetch = useCallback(() => {
    fetchFreeLessons();
  }, [fetchFreeLessons]);

  return {
    lessons,
    loading,
    refetch,
    isStaff,
  };
}
