import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * System Status Indicator Logic
 * 
 * Purpose: "هل السيستم اشتغل فعلًا ولا لسه؟"
 * 
 * States (Priority: Black > Red > Yellow > Green - PESSIMISTIC):
 * 1. فشل جماعي (Black/Critical) - System Not Activated
 * 2. خطر (Red/Danger) - Critical issues
 * 3. غير مستقر (Yellow/Warning) - Unstable, needs adjustment
 * 4. مستقر (Green/Success) - Stable and working
 */

export type SystemStatusLevel = 'critical' | 'danger' | 'warning' | 'success';

export interface SystemStatusData {
  level: SystemStatusLevel;
  labelAr: string;
  labelEn: string;
  description: string;
  loading: boolean;
}

interface StatusMetrics {
  // Students & Enrollments
  totalStudents: number;
  activeEnrollments: number;
  
  // Interactions (Real activity indicators)
  meaningfulFocusSessions: number; // Sessions > 2 minutes
  lessonAttendance: number;
  
  // Exam Performance
  totalExamAttempts: number;
  passedExams: number;
  failedExams: number;
  avgExamScore: number;
}

// Thresholds for status determination
const THRESHOLDS = {
  // Minimum meaningful interactions to consider system "activated"
  MIN_FOCUS_SESSIONS: 5,
  MIN_LESSON_ATTENDANCE: 3,
  MIN_EXAM_ATTEMPTS: 3,
  
  // Pass rate thresholds
  CRITICAL_PASS_RATE: 40, // Below this = خطر
  UNSTABLE_PASS_RATE: 60, // Below this = غير مستقر
  
  // Score thresholds  
  CRITICAL_AVG_SCORE: 50,
  UNSTABLE_AVG_SCORE: 65,
};

export const useSystemStatus = (): SystemStatusData => {
  const [status, setStatus] = useState<SystemStatusData>({
    level: 'critical',
    labelAr: 'فشل جماعي',
    labelEn: 'Not Activated',
    description: '',
    loading: true,
  });

  const calculateStatus = useCallback((metrics: StatusMetrics): SystemStatusData => {
    const {
      totalStudents,
      activeEnrollments,
      meaningfulFocusSessions,
      lessonAttendance,
      totalExamAttempts,
      passedExams,
      failedExams,
      avgExamScore,
    } = metrics;

    // Helper to check if system has any real activity
    const hasStudentsAndEnrollments = totalStudents > 0 && activeEnrollments > 0;
    const hasMeaningfulInteraction = 
      meaningfulFocusSessions >= THRESHOLDS.MIN_FOCUS_SESSIONS ||
      lessonAttendance >= THRESHOLDS.MIN_LESSON_ATTENDANCE;
    const hasExamActivity = totalExamAttempts >= THRESHOLDS.MIN_EXAM_ATTEMPTS;

    // Calculate pass rate
    const passRate = totalExamAttempts > 0 
      ? (passedExams / totalExamAttempts) * 100 
      : 0;

    // ═══════════════════════════════════════════════════════════════
    // STATE 1: فشل جماعي (Black/Critical) - System Not Activated
    // ═══════════════════════════════════════════════════════════════
    // Students exist, enrollments exist, BUT no real learning happened
    if (hasStudentsAndEnrollments && !hasMeaningfulInteraction && !hasExamActivity) {
      return {
        level: 'critical',
        labelAr: 'فشل جماعي',
        labelEn: 'Not Activated',
        description: 'السيستم لسه متفتحش فعليًا - مفيش تعلم حصل',
        loading: false,
      };
    }

    // No students or enrollments at all
    if (!hasStudentsAndEnrollments) {
      return {
        level: 'critical',
        labelAr: 'فشل جماعي',
        labelEn: 'Not Activated',
        description: 'مفيش طلاب أو اشتراكات نشطة',
        loading: false,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE 2: خطر (Red/Danger) - Critical Issues
    // ═══════════════════════════════════════════════════════════════
    // System is working but results are very bad
    if (hasExamActivity) {
      if (passRate < THRESHOLDS.CRITICAL_PASS_RATE || avgExamScore < THRESHOLDS.CRITICAL_AVG_SCORE) {
        return {
          level: 'danger',
          labelAr: 'خطر',
          labelEn: 'Critical',
          description: 'فيه شغل بس النتايج سيئة جداً',
          loading: false,
        };
      }
    }

    // Has meaningful interaction but exam results show critical failure
    if (hasMeaningfulInteraction && hasExamActivity) {
      const failureRatio = failedExams / totalExamAttempts;
      if (failureRatio > 0.6) { // More than 60% failed
        return {
          level: 'danger',
          labelAr: 'خطر',
          labelEn: 'Critical',
          description: 'نسبة الرسوب عالية جداً',
          loading: false,
        };
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE 3: غير مستقر (Yellow/Warning) - Unstable
    // ═══════════════════════════════════════════════════════════════
    // Active but mixed results
    if (hasExamActivity) {
      if (passRate < THRESHOLDS.UNSTABLE_PASS_RATE || avgExamScore < THRESHOLDS.UNSTABLE_AVG_SCORE) {
        return {
          level: 'warning',
          labelAr: 'غير مستقر',
          labelEn: 'Unstable',
          description: 'السيستم شغال بس محتاج ضبط',
          loading: false,
        };
      }
    }

    // Has some interaction but not enough exam data to fully validate
    if (hasMeaningfulInteraction && !hasExamActivity) {
      return {
        level: 'warning',
        labelAr: 'غير مستقر',
        labelEn: 'Unstable',
        description: 'فيه تفاعل بس محتاج متابعة الامتحانات',
        loading: false,
      };
    }

    // ═══════════════════════════════════════════════════════════════
    // STATE 4: مستقر (Green/Success) - Stable
    // ═══════════════════════════════════════════════════════════════
    // Everything is working well
    return {
      level: 'success',
      labelAr: 'مستقر',
      labelEn: 'Stable',
      description: 'المنصة شغالة صح والنتايج كويسة',
      loading: false,
    };
  }, []);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch all metrics in parallel using EXISTING data only
        const [
          { count: studentsCount },
          { data: enrollments },
          { count: focusSessionsCount },
          { count: attendanceCount },
          { data: examAttempts },
        ] = await Promise.all([
          // Total students
          supabase
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'student'),
          
          // Enrollments (to count active)
          supabase
            .from('course_enrollments')
            .select('status'),
          
          // Meaningful focus sessions (> 2 minutes = 120 seconds)
          supabase
            .from('focus_sessions')
            .select('*', { count: 'exact', head: true })
            .gt('total_active_seconds', 120),
          
          // Lesson attendance
          supabase
            .from('lesson_attendance')
            .select('*', { count: 'exact', head: true }),
          
          // Exam attempts with scores for pass/fail analysis
          supabase
            .from('exam_attempts')
            .select('score, total_questions, is_completed, exams:exam_id(pass_mark, max_score)')
            .eq('is_completed', true),
        ]);

        // Calculate derived metrics
        const activeEnrollments = enrollments?.filter(e => e.status === 'active').length || 0;
        
        // Calculate exam performance
        const completedAttempts = examAttempts || [];
        const totalExamAttempts = completedAttempts.length;
        
        let passedExams = 0;
        let failedExams = 0;
        let totalScore = 0;
        
        completedAttempts.forEach((attempt) => {
          const exam = attempt.exams as any;
          const passMark = exam?.pass_mark || 50;
          const maxScore = exam?.max_score || 100;
          
          // Calculate percentage score
          const percentageScore = attempt.total_questions > 0
            ? (attempt.score / attempt.total_questions) * maxScore
            : 0;
          
          const scorePercent = (percentageScore / maxScore) * 100;
          totalScore += scorePercent;
          
          if (scorePercent >= passMark) {
            passedExams++;
          } else {
            failedExams++;
          }
        });

        const avgExamScore = totalExamAttempts > 0 
          ? Math.round(totalScore / totalExamAttempts) 
          : 0;

        const metrics: StatusMetrics = {
          totalStudents: studentsCount || 0,
          activeEnrollments,
          meaningfulFocusSessions: focusSessionsCount || 0,
          lessonAttendance: attendanceCount || 0,
          totalExamAttempts,
          passedExams,
          failedExams,
          avgExamScore,
        };

        const calculatedStatus = calculateStatus(metrics);
        setStatus(calculatedStatus);

      } catch (error) {
        console.error('Error fetching system status metrics:', error);
        // Default to critical on error (pessimistic)
        setStatus({
          level: 'critical',
          labelAr: 'فشل جماعي',
          labelEn: 'Not Activated',
          description: 'خطأ في تحميل البيانات',
          loading: false,
        });
      }
    };

    fetchMetrics();
  }, [calculateStatus]);

  return status;
};
