/**
 * Student Behavioral Status Engine
 * 
 * Determines student engagement status based on REAL behavior data.
 * 
 * States:
 * - ACTIVE: Actively learning (recent focus, lesson progress)
 * - AT_RISK: Shows signs of disengagement (irregular activity)
 * - DORMANT: No recent activity (needs intervention)
 * - LOYAL: Consistent, long-term engagement
 * 
 * ARCHITECTURE RULES:
 * - Deterministic and explainable logic
 * - No fake progress or gamification lies
 * - Based purely on EXISTING data
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type StudentStatus = 'ACTIVE' | 'AT_RISK' | 'DORMANT' | 'LOYAL' | 'NEW';

export interface StudentBehaviorData {
  status: StudentStatus;
  labelAr: string;
  labelEn: string;
  ctaAr: string;
  ctaEn: string;
  loading: boolean;
  metrics: StudentBehaviorMetrics | null;
}

export interface StudentBehaviorMetrics {
  daysSinceLastFocus: number | null;
  totalFocusMinutesLast7Days: number;
  totalFocusMinutesLast30Days: number;
  lessonsCompletedLast7Days: number;
  lessonsCompletedLast30Days: number;
  examAttemptsLast30Days: number;
  avgExamScoreLast30Days: number;
  accountAgeDays: number;
  consistencyScore: number; // 0-100 based on activity regularity
}

// Thresholds for status determination
const THRESHOLDS = {
  // Days without focus to be considered dormant
  DORMANT_DAYS: 14,
  
  // Days without focus to be considered at risk
  AT_RISK_DAYS: 7,
  
  // Minimum focus minutes per week for "active" status
  ACTIVE_WEEKLY_FOCUS_MINUTES: 30,
  
  // Loyalty threshold (days of consistent activity)
  LOYAL_ACCOUNT_AGE_DAYS: 60,
  LOYAL_CONSISTENCY_SCORE: 70,
  
  // New user threshold
  NEW_USER_DAYS: 7,
};

export const useStudentBehavior = (studentId?: string): StudentBehaviorData => {
  const { user } = useAuth();
  const targetUserId = studentId || user?.id;
  
  const [data, setData] = useState<StudentBehaviorData>({
    status: 'NEW',
    labelAr: 'جديد',
    labelEn: 'New',
    ctaAr: '',
    ctaEn: '',
    loading: true,
    metrics: null,
  });

  const calculateStatus = useCallback((metrics: StudentBehaviorMetrics): StudentBehaviorData => {
    const {
      daysSinceLastFocus,
      totalFocusMinutesLast7Days,
      lessonsCompletedLast7Days,
      lessonsCompletedLast30Days,
      examAttemptsLast30Days,
      avgExamScoreLast30Days,
      accountAgeDays,
      consistencyScore,
    } = metrics;

    // ═══════════════════════════════════════════════════════════════════
    // NEW USER: Account age < 7 days
    // ═══════════════════════════════════════════════════════════════════
    if (accountAgeDays < THRESHOLDS.NEW_USER_DAYS) {
      return {
        status: 'NEW',
        labelAr: 'طالب جديد',
        labelEn: 'New Student',
        ctaAr: 'ابدأ أول حصة واكتشف المنصة',
        ctaEn: 'Start your first lesson and explore',
        loading: false,
        metrics,
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // DORMANT: No activity for 14+ days
    // ═══════════════════════════════════════════════════════════════════
    if (daysSinceLastFocus !== null && daysSinceLastFocus >= THRESHOLDS.DORMANT_DAYS) {
      return {
        status: 'DORMANT',
        labelAr: 'غير نشط',
        labelEn: 'Inactive',
        ctaAr: 'عدنا نستناك! ارجع كمّل من حيث وقفت',
        ctaEn: 'We miss you! Continue where you left off',
        loading: false,
        metrics,
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // LOYAL: Long-term consistent engagement
    // ═══════════════════════════════════════════════════════════════════
    if (
      accountAgeDays >= THRESHOLDS.LOYAL_ACCOUNT_AGE_DAYS &&
      consistencyScore >= THRESHOLDS.LOYAL_CONSISTENCY_SCORE &&
      lessonsCompletedLast30Days >= 10
    ) {
      return {
        status: 'LOYAL',
        labelAr: 'طالب مثالي',
        labelEn: 'Star Student',
        ctaAr: 'استمر على الوتيرة الممتازة! 🌟',
        ctaEn: 'Keep up the excellent pace! 🌟',
        loading: false,
        metrics,
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // AT_RISK: Shows signs of disengagement
    // ═══════════════════════════════════════════════════════════════════
    const isAtRisk = 
      (daysSinceLastFocus !== null && daysSinceLastFocus >= THRESHOLDS.AT_RISK_DAYS) ||
      (totalFocusMinutesLast7Days < THRESHOLDS.ACTIVE_WEEKLY_FOCUS_MINUTES && lessonsCompletedLast7Days === 0);

    if (isAtRisk) {
      return {
        status: 'AT_RISK',
        labelAr: 'محتاج متابعة',
        labelEn: 'Needs Attention',
        ctaAr: 'رجعتلك! كمّل حصة واحدة بس النهاردة',
        ctaEn: 'You got this! Complete just one lesson today',
        loading: false,
        metrics,
      };
    }

    // ═══════════════════════════════════════════════════════════════════
    // ACTIVE: Regular engagement
    // ═══════════════════════════════════════════════════════════════════
    return {
      status: 'ACTIVE',
      labelAr: 'نشط',
      labelEn: 'Active',
      ctaAr: 'أداءك ممتاز! كمل بنفس الروح 💪',
      ctaEn: 'Great progress! Keep the momentum 💪',
      loading: false,
      metrics,
    };
  }, []);

  const fetchBehaviorData = useCallback(async () => {
    if (!targetUserId) {
      setData(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch all data in parallel
      const [
        { data: profile },
        { data: focusSessions },
        { data: recentCompletions },
        { data: recentExams },
      ] = await Promise.all([
        // Profile for account age
        supabase
          .from('profiles')
          .select('created_at')
          .eq('user_id', targetUserId)
          .single(),

        // Focus sessions for engagement analysis
        supabase
          .from('focus_sessions')
          .select('total_active_seconds, created_at')
          .eq('user_id', targetUserId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false }),

        // Lesson completions
        supabase
          .from('lesson_completions')
          .select('completed_at')
          .eq('user_id', targetUserId)
          .gte('completed_at', thirtyDaysAgo.toISOString()),

        // Exam attempts
        supabase
          .from('exam_attempts')
          .select('score, total_questions, completed_at')
          .eq('user_id', targetUserId)
          .eq('is_completed', true)
          .gte('completed_at', thirtyDaysAgo.toISOString()),
      ]);

      // Calculate metrics
      const accountAgeDays = profile?.created_at
        ? Math.floor((now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // Days since last focus
      const lastFocusSession = focusSessions?.[0];
      const daysSinceLastFocus = lastFocusSession
        ? Math.floor((now.getTime() - new Date(lastFocusSession.created_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Focus minutes calculation
      const focusLast7Days = (focusSessions || [])
        .filter(s => new Date(s.created_at) >= sevenDaysAgo)
        .reduce((sum, s) => sum + (s.total_active_seconds || 0), 0);

      const focusLast30Days = (focusSessions || [])
        .reduce((sum, s) => sum + (s.total_active_seconds || 0), 0);

      // Lessons completed
      const lessonsLast7Days = (recentCompletions || [])
        .filter(c => new Date(c.completed_at) >= sevenDaysAgo).length;

      const lessonsLast30Days = (recentCompletions || []).length;

      // Exam metrics
      const examAttemptsLast30Days = (recentExams || []).length;
      const avgExamScore = examAttemptsLast30Days > 0
        ? Math.round(
            (recentExams || []).reduce((sum, e) => 
              sum + (e.total_questions > 0 ? (e.score / e.total_questions) * 100 : 0), 
            0) / examAttemptsLast30Days
          )
        : 0;

      // Consistency score: based on active days ratio over last 30 days
      const activeDays = new Set(
        (focusSessions || []).map(s => 
          new Date(s.created_at).toISOString().split('T')[0]
        )
      ).size;
      const consistencyScore = Math.round((activeDays / 30) * 100);

      const metrics: StudentBehaviorMetrics = {
        daysSinceLastFocus,
        totalFocusMinutesLast7Days: Math.round(focusLast7Days / 60),
        totalFocusMinutesLast30Days: Math.round(focusLast30Days / 60),
        lessonsCompletedLast7Days: lessonsLast7Days,
        lessonsCompletedLast30Days: lessonsLast30Days,
        examAttemptsLast30Days,
        avgExamScoreLast30Days: avgExamScore,
        accountAgeDays,
        consistencyScore,
      };

      const calculatedData = calculateStatus(metrics);
      setData(calculatedData);

    } catch (error) {
      console.error('Error fetching student behavior:', error);
      setData({
        status: 'NEW',
        labelAr: 'غير محدد',
        labelEn: 'Unknown',
        ctaAr: '',
        ctaEn: '',
        loading: false,
        metrics: null,
      });
    }
  }, [targetUserId, calculateStatus]);

  useEffect(() => {
    fetchBehaviorData();
  }, [fetchBehaviorData]);

  return data;
};

/**
 * Get status color for UI rendering
 */
export const getStatusColor = (status: StudentStatus) => {
  switch (status) {
    case 'LOYAL':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'ACTIVE':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'AT_RISK':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'DORMANT':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'NEW':
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
};
