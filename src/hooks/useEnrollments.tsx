/**
 * Centralized Enrollments Hook
 * 
 * Provides cached enrollment data to avoid duplicate fetches across components.
 * Enrollments are fetched once per session and cached in memory.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  status: 'pending' | 'active' | 'suspended' | 'expired' | 'cancelled';
  progress: number;
  completed_lessons: number;
  enrolled_at: string;
  activated_at: string | null;
}

export interface EnrollmentWithCourse extends Enrollment {
  course: {
    id: string;
    title: string;
    title_ar: string;
    grade: string;
    is_free: boolean;
    lessons_count: number;
    duration_hours: number;
  };
}

// In-memory cache
let enrollmentsCache: { userId: string; enrollments: EnrollmentWithCourse[]; fetchedAt: number } | null = null;
const ENROLLMENTS_CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes (shorter for more dynamic data)

export const useEnrollments = () => {
  const { user, loading: authLoading } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrollmentWithCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEnrollments = useCallback(async (forceRefresh = false) => {
    // PHASE GUARD: Do not fetch until auth is resolved
    if (authLoading) return;

    const userId = user?.id;

    if (!userId) {
      enrollmentsCache = null;
      setEnrollments([]);
      setLoading(false);
      return;
    }

    // Check cache
    const cached = enrollmentsCache?.userId === userId ? enrollmentsCache : null;
    const cacheFresh = cached && Date.now() - cached.fetchedAt < ENROLLMENTS_CACHE_TTL_MS;

    if (cacheFresh && !forceRefresh) {
      setEnrollments(cached.enrollments);
      setLoading(false);
      return;
    }

    // Use stale data while refreshing (no loading flicker)
    if (cached && !forceRefresh) {
      setEnrollments(cached.enrollments);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('course_enrollments')
        .select(`
          id,
          course_id,
          user_id,
          status,
          progress,
          completed_lessons,
          enrolled_at,
          activated_at,
          course:courses (
            id,
            title,
            title_ar,
            grade,
            is_free,
            lessons_count,
            duration_hours
          )
        `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

      if (fetchError) throw fetchError;

      const typedEnrollments = (data || []) as unknown as EnrollmentWithCourse[];
      enrollmentsCache = { userId, enrollments: typedEnrollments, fetchedAt: Date.now() };
      setEnrollments(typedEnrollments);
      setError(null);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  // STABLE DEPS: Use user?.id instead of user object to prevent reference instability
  }, [authLoading, user?.id]);

  useEffect(() => {
    fetchEnrollments();
  }, [fetchEnrollments]);

  // Active enrollments include 'active' status only (not suspended)
  const activeEnrollments = useMemo(() => 
    enrollments.filter(e => e.status === 'active'),
    [enrollments]
  );

  // Suspended enrollments - student can view completed lessons only
  const suspendedEnrollments = useMemo(() => 
    enrollments.filter(e => e.status === 'suspended'),
    [enrollments]
  );

  const pendingEnrollments = useMemo(() => 
    enrollments.filter(e => e.status === 'pending'),
    [enrollments]
  );

  const isEnrolledIn = useCallback((courseId: string) => {
    return enrollments.some(e => e.course_id === courseId);
  }, [enrollments]);

  const getEnrollmentStatus = useCallback((courseId: string) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    return enrollment?.status || null;
  }, [enrollments]);

  // Check if user has suspended enrollment (can view completed lessons only)
  const isSuspendedIn = useCallback((courseId: string) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    return enrollment?.status === 'suspended';
  }, [enrollments]);

  return {
    enrollments,
    activeEnrollments,
    suspendedEnrollments,
    pendingEnrollments,
    loading,
    error,
    isEnrolledIn,
    getEnrollmentStatus,
    isSuspendedIn,
    refreshEnrollments: () => fetchEnrollments(true),
  };
};

// Clear cache on sign out
export const clearEnrollmentsCache = () => {
  enrollmentsCache = null;
};
