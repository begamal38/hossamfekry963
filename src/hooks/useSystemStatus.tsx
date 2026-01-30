import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  SystemStatusCode, 
  SystemStatusLevel, 
  getSystemStatusLevel 
} from '@/lib/statusCopy';

// ═══════════════════════════════════════════════════════════════════════════
// Types - Pure Data, No Text
// ═══════════════════════════════════════════════════════════════════════════

export interface SystemStatusMetrics {
  totalStudents: number;
  activeEnrollments: number;
  meaningfulFocusSessions: number;
  lessonAttendance: number;
  totalExamAttempts: number;
  passedExams: number;
  failedExams: number;
  avgExamScore: number;
  passRate: number;
  /** Whether any exams have been published (status = 'published') */
  hasPublishedExams: boolean;
}

export interface SystemStatusData {
  /** Status code - UI must map this to localized text */
  statusCode: SystemStatusCode;
  /** Derived level for styling */
  level: SystemStatusLevel;
  /** Loading state */
  loading: boolean;
  /** Raw metrics for tooltip display */
  metrics: SystemStatusMetrics | null;
}

// ═══════════════════════════════════════════════════════════════════════════
// Thresholds (configurable)
// ═══════════════════════════════════════════════════════════════════════════

const THRESHOLDS = {
  MIN_FOCUS_DURATION_SECONDS: 120, // 2 minutes = meaningful session
  CRITICAL_PASS_RATE: 30,
  CRITICAL_AVG_SCORE: 40,
  UNSTABLE_PASS_RATE: 60,
  UNSTABLE_AVG_SCORE: 50,
};

// ═══════════════════════════════════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════════════════════════════════

export const useSystemStatus = (): SystemStatusData => {
  const [status, setStatus] = useState<SystemStatusData>({
    statusCode: 'NOT_ACTIVATED',
    level: 'critical',
    loading: true,
    metrics: null,
  });

  /**
   * Calculate status from metrics - returns STATUS CODE only
   * Phase-aware: distinguishes between "no exams published" vs "exams published but not taken"
   */
  const calculateStatus = useCallback((metrics: SystemStatusMetrics): SystemStatusCode => {
    const hasStudentsAndEnrollments = metrics.totalStudents > 0 && metrics.activeEnrollments > 0;
    const hasMeaningfulInteraction = metrics.meaningfulFocusSessions > 0 || metrics.lessonAttendance > 0;
    const hasExamActivity = metrics.totalExamAttempts > 0;
    const hasPublishedExams = metrics.hasPublishedExams;

    // Priority 1: Check if system is activated at all
    if (hasStudentsAndEnrollments && !hasMeaningfulInteraction && !hasExamActivity) {
      return 'NOT_ACTIVATED';
    }

    if (!hasStudentsAndEnrollments) {
      return 'NO_STUDENTS_OR_ENROLLMENTS';
    }

    // Priority 2: Check for critical failure patterns (only if exams were taken)
    if (hasExamActivity) {
      const { passRate, avgExamScore, passedExams, failedExams } = metrics;

      if (passRate < THRESHOLDS.CRITICAL_PASS_RATE || avgExamScore < THRESHOLDS.CRITICAL_AVG_SCORE) {
        return 'CRITICAL_PASS_RATE';
      }

      const failureRatio = failedExams / (passedExams + failedExams);
      if (failureRatio > 0.6) {
        return 'HIGH_FAILURE_RATE';
      }

      if (passRate < THRESHOLDS.UNSTABLE_PASS_RATE || avgExamScore < THRESHOLDS.UNSTABLE_AVG_SCORE) {
        return 'UNSTABLE_RESULTS';
      }
    }

    // Priority 3: Phase-aware engagement evaluation
    if (hasMeaningfulInteraction && !hasExamActivity) {
      // If exams are published but no one is taking them → needs follow-up
      if (hasPublishedExams) {
        return 'NEEDS_EXAM_FOLLOWUP';
      }
      // If no exams published yet → this is expected pre-exam engagement (positive!)
      return 'PRE_EXAM_ENGAGING';
    }

    // System is stable
    return 'STABLE';
  }, []);

  /**
   * Fetch metrics from database
   */
  const fetchMetrics = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));

      // Parallel fetch all required data including published exams check
      const [
        { count: studentsCount },
        { data: enrollments },
        { data: focusSessions },
        { count: attendanceCount },
        { data: examAttempts },
        { count: publishedExamsCount },
      ] = await Promise.all([
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('course_enrollments').select('status'),
        supabase.from('focus_sessions').select('total_active_seconds'),
        supabase.from('lesson_attendance').select('*', { count: 'exact', head: true }),
        supabase.from('exam_attempts').select('score, total_questions, is_completed, exams:exam_id(pass_mark, max_score)').eq('is_completed', true),
        supabase.from('exams').select('*', { count: 'exact', head: true }).eq('status', 'published'),
      ]);

      // Calculate derived metrics
      const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
      const meaningfulFocusSessions = focusSessions?.filter(
        s => s.total_active_seconds >= THRESHOLDS.MIN_FOCUS_DURATION_SECONDS
      ).length || 0;

      let passedExams = 0;
      let failedExams = 0;
      let totalScore = 0;

      (examAttempts || []).forEach(attempt => {
        const exam = attempt.exams as any;
        const passMark = exam?.pass_mark || 50;
        const maxScore = exam?.max_score || 100;
        const percentageScore = (attempt.score / attempt.total_questions) * maxScore;
        const normalizedScore = (percentageScore / maxScore) * 100;

        totalScore += normalizedScore;

        if (percentageScore >= passMark) {
          passedExams++;
        } else {
          failedExams++;
        }
      });

      const totalAttempts = (examAttempts || []).length;
      const avgExamScore = totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0;
      const passRate = totalAttempts > 0 ? Math.round((passedExams / totalAttempts) * 100) : 0;
      const hasPublishedExams = (publishedExamsCount || 0) > 0;

      const metrics: SystemStatusMetrics = {
        totalStudents: studentsCount || 0,
        activeEnrollments,
        meaningfulFocusSessions,
        lessonAttendance: attendanceCount || 0,
        totalExamAttempts: totalAttempts,
        passedExams,
        failedExams,
        avgExamScore,
        passRate,
        hasPublishedExams,
      };

      const statusCode = calculateStatus(metrics);

      setStatus({
        statusCode,
        level: getSystemStatusLevel(statusCode),
        loading: false,
        metrics,
      });
    } catch (error) {
      console.error('Error fetching system status:', error);
      setStatus({
        statusCode: 'DATA_LOAD_ERROR',
        level: 'critical',
        loading: false,
        metrics: null,
      });
    }
  }, [calculateStatus]);

  // Initial fetch and realtime subscription
  useEffect(() => {
    fetchMetrics();

    // Subscribe to realtime changes (including exams table for publish detection)
    const channel = supabase
      .channel('system-status-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exam_attempts' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lesson_attendance' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'focus_sessions' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'course_enrollments' }, fetchMetrics)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exams' }, fetchMetrics)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMetrics]);

  return status;
};
