import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { StudentStatusCode } from '@/lib/statusCopy';

// ═══════════════════════════════════════════════════════════════════════════
// Types - Pure Data, No Text
// ═══════════════════════════════════════════════════════════════════════════

export interface StudentBehaviorMetrics {
  accountAgeDays: number;
  daysSinceLastFocus: number | null;
  totalFocusSessions: number;
  totalFocusMinutes: number;
  completedLessons: number;
  examAttempts: number;
  avgExamScore: number;
}

export interface StudentBehaviorData {
  /** Status code - UI must map this to localized text */
  statusCode: StudentStatusCode;
  /** Loading state */
  loading: boolean;
  /** Raw metrics for display/debugging */
  metrics: StudentBehaviorMetrics | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Thresholds (configurable)
// ═══════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  NEW_USER_DAYS: 3,
  DORMANT_DAYS: 14,
  AT_RISK_DAYS: 7,
  LOYAL_MIN_FOCUS_SESSIONS: 10,
  LOYAL_MIN_FOCUS_MINUTES: 120,
  LOYAL_RECENT_ACTIVITY_DAYS: 3,
};

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export const useStudentBehavior = (): StudentBehaviorData => {
  const { user } = useAuth();
  
  const [data, setData] = useState<StudentBehaviorData>({
    statusCode: 'NEW',
    loading: true,
    metrics: null,
  });

  /**
   * Determine status from metrics - returns STATUS CODE only
   */
  const determineStatus = useCallback((metrics: StudentBehaviorMetrics): StudentStatusCode => {
    const { 
      accountAgeDays, 
      daysSinceLastFocus, 
      totalFocusSessions, 
      totalFocusMinutes 
    } = metrics;

    // New User: Account < 3 days old
    if (accountAgeDays < THRESHOLDS.NEW_USER_DAYS) {
      return 'NEW';
    }

    // Dormant: No activity for 14+ days
    if (daysSinceLastFocus !== null && daysSinceLastFocus >= THRESHOLDS.DORMANT_DAYS) {
      return 'DORMANT';
    }

    // Loyal: High engagement + recent activity
    const isLoyal = 
      totalFocusSessions >= THRESHOLDS.LOYAL_MIN_FOCUS_SESSIONS &&
      totalFocusMinutes >= THRESHOLDS.LOYAL_MIN_FOCUS_MINUTES &&
      daysSinceLastFocus !== null && 
      daysSinceLastFocus <= THRESHOLDS.LOYAL_RECENT_ACTIVITY_DAYS;

    if (isLoyal) {
      return 'LOYAL';
    }

    // At Risk: No activity for 7-13 days
    const isAtRisk = 
      daysSinceLastFocus !== null && 
      daysSinceLastFocus >= THRESHOLDS.AT_RISK_DAYS && 
      daysSinceLastFocus < THRESHOLDS.DORMANT_DAYS;

    if (isAtRisk) {
      return 'AT_RISK';
    }

    // Default: Active
    return 'ACTIVE';
  }, []);

  /**
   * Fetch behavior metrics from database
   */
  const fetchBehavior = useCallback(async () => {
    if (!user) {
      setData({ statusCode: 'NEW', loading: false, metrics: null });
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true }));

      // Parallel fetch all required data
      const [
        { data: profile },
        { data: focusSessions },
        { count: completedLessonsCount },
        { data: examAttempts },
      ] = await Promise.all([
        supabase.from('profiles').select('created_at').eq('user_id', user.id).maybeSingle(),
        supabase.from('focus_sessions').select('started_at, total_active_seconds').eq('user_id', user.id).order('started_at', { ascending: false }),
        supabase.from('lesson_completions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('exam_attempts').select('score, total_questions').eq('user_id', user.id).eq('is_completed', true),
      ]);

      // Calculate account age
      const createdAt = profile?.created_at ? new Date(profile.created_at) : new Date();
      const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      // Calculate days since last focus
      let daysSinceLastFocus: number | null = null;
      if (focusSessions && focusSessions.length > 0) {
        const lastSession = new Date(focusSessions[0].started_at);
        daysSinceLastFocus = Math.floor((Date.now() - lastSession.getTime()) / (1000 * 60 * 60 * 24));
      }

      // Calculate total focus metrics
      const totalFocusSessions = focusSessions?.length || 0;
      const totalFocusMinutes = Math.round(
        (focusSessions || []).reduce((sum, s) => sum + (s.total_active_seconds || 0), 0) / 60
      );

      // Calculate exam metrics
      const examAttemptsCount = examAttempts?.length || 0;
      const avgExamScore = examAttemptsCount > 0
        ? Math.round(
            examAttempts!.reduce((sum, a) => sum + ((a.score / a.total_questions) * 100), 0) / examAttemptsCount
          )
        : 0;

      const metrics: StudentBehaviorMetrics = {
        accountAgeDays,
        daysSinceLastFocus,
        totalFocusSessions,
        totalFocusMinutes,
        completedLessons: completedLessonsCount || 0,
        examAttempts: examAttemptsCount,
        avgExamScore,
      };

      const statusCode = determineStatus(metrics);

      setData({
        statusCode,
        loading: false,
        metrics,
      });
    } catch (error) {
      console.error('Error fetching student behavior:', error);
      setData({
        statusCode: 'UNKNOWN',
        loading: false,
        metrics: null,
      });
    }
  }, [user, determineStatus]);

  // Fetch on mount and user change
  useEffect(() => {
    fetchBehavior();
  }, [fetchBehavior]);

  return data;
};
