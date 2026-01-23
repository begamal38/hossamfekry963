/**
 * Free Lessons Hook
 * 
 * Single source of truth for free lessons visibility.
 * Uses centralized eligibility logic from courseEligibility.ts
 * 
 * System 3 Rules:
 * - Anonymous visitors: See ALL free lessons (discovery/marketing)
 * - Authenticated students: See ONLY free lessons matching grade/track
 * - Staff: See ALL free lessons
 * 
 * FORBIDDEN: attendance_mode, center_group, and enrollments are NOT checked
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidVideo } from '@/lib/contentVisibility';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import { canViewFreeLesson, buildEligibilityContext, type LessonInfo } from '@/lib/courseEligibility';

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
  const [studentProfile, setStudentProfile] = useState<{ grade: string | null; language_track: string | null } | null>(null);

  // Staff check - wait for roles to fully load
  const isStaff = !rolesLoading && (isAdmin() || isAssistantTeacher());

  // Fetch user's profile for filtering (students only)
  useEffect(() => {
    if (rolesLoading) return;
    
    const fetchUserProfile = async () => {
      // Staff don't need profile filtering
      if (!user || isStaff) {
        setStudentProfile(null);
        return;
      }
      
      const { data } = await supabase
        .from('profiles')
        .select('grade, language_track')
        .eq('user_id', user.id)
        .maybeSingle();
      
      setStudentProfile(data ? { grade: data.grade, language_track: data.language_track } : null);
    };
    
    fetchUserProfile();
  }, [user, isStaff, rolesLoading]);

  /**
   * Fetch free lessons using centralized eligibility
   */
  const fetchFreeLessons = useCallback(async () => {
    setLoading(true);
    try {
      // Query all free lessons
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
      
      // Filter to only lessons with valid videos
      let validLessons = (data || []).filter(lesson => hasValidVideo(lesson.video_url));
      
      // Apply System 3 eligibility rules if filtering is enabled
      if (filterByUserGrade) {
        const ctx = buildEligibilityContext({
          user: user ? { id: user.id } : null,
          isStaff,
          profile: studentProfile,
          enrollments: [], // Free lessons don't check enrollments
        });
        
        validLessons = validLessons.filter(lesson => {
          const lessonInfo: LessonInfo = {
            id: lesson.id,
            is_free_lesson: lesson.is_free_lesson,
            course_id: lesson.course_id,
            courses: lesson.courses ? { grade: lesson.courses.grade } : null,
          };
          return canViewFreeLesson(lessonInfo, ctx);
        });
      }
      
      setLessons(validLessons);
    } catch (error) {
      console.error('Error fetching free lessons:', error);
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [user, isStaff, studentProfile, filterByUserGrade]);

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
