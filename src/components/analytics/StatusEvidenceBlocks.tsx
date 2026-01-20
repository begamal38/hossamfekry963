/**
 * Status Evidence Blocks
 * 
 * Displays the exact data that caused the current system status.
 * Maps 1:1 to Status Engine inputs - NO new calculations.
 * 
 * This component answers: "What data caused this status?"
 */

import React from 'react';
import { 
  Users, 
  BookOpen, 
  ClipboardCheck, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  XCircle,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type SystemStatusMetrics } from '@/hooks/useSystemStatus';
import { type SystemStatusCode, STATUS_VISUALS } from '@/lib/statusCopy';

interface StatusEvidenceBlocksProps {
  metrics: SystemStatusMetrics | null;
  statusCode: SystemStatusCode;
  isRTL: boolean;
}

interface EvidenceBlock {
  id: string;
  icon: LucideIcon;
  label: { ar: string; en: string };
  value: number | string;
  subValue?: { ar: string; en: string };
  /** Whether this metric contributed to the current status */
  isRelevant: boolean;
  /** Visual treatment based on health */
  health: 'good' | 'warning' | 'critical' | 'neutral';
}

/**
 * Determines which evidence blocks to show based on status code.
 * Each status has specific dimensions that caused it.
 */
function getRelevantDimensions(statusCode: SystemStatusCode): string[] {
  switch (statusCode) {
    case 'NOT_ACTIVATED':
      return ['engagement', 'examActivity'];
    case 'NO_STUDENTS_OR_ENROLLMENTS':
      return ['students', 'enrollments'];
    case 'CRITICAL_PASS_RATE':
    case 'HIGH_FAILURE_RATE':
      return ['passRate', 'avgScore', 'examAttempts'];
    case 'UNSTABLE_RESULTS':
      return ['passRate', 'avgScore'];
    case 'NEEDS_EXAM_FOLLOWUP':
      return ['engagement', 'examActivity'];
    case 'STABLE':
      return ['students', 'engagement', 'passRate'];
    case 'DATA_LOAD_ERROR':
      return [];
    default:
      return [];
  }
}

export const StatusEvidenceBlocks: React.FC<StatusEvidenceBlocksProps> = ({
  metrics,
  statusCode,
  isRTL,
}) => {
  if (!metrics) {
    return null;
  }

  const relevantDimensions = getRelevantDimensions(statusCode);
  const visual = STATUS_VISUALS[statusCode];

  // Build evidence blocks from ACTUAL metrics
  const evidenceBlocks: EvidenceBlock[] = [];

  // Students & Enrollments
  if (metrics.totalStudents > 0 || relevantDimensions.includes('students')) {
    evidenceBlocks.push({
      id: 'students',
      icon: Users,
      label: { ar: 'الطلاب المسجلين', en: 'Enrolled Students' },
      value: metrics.totalStudents,
      subValue: {
        ar: `${metrics.activeEnrollments} اشتراك نشط`,
        en: `${metrics.activeEnrollments} active enrollments`,
      },
      isRelevant: relevantDimensions.includes('students') || relevantDimensions.includes('enrollments'),
      health: metrics.totalStudents > 0 && metrics.activeEnrollments > 0 ? 'good' : 'critical',
    });
  }

  // Lesson Engagement (Attendance)
  if (metrics.lessonAttendance > 0 || relevantDimensions.includes('engagement')) {
    evidenceBlocks.push({
      id: 'engagement',
      icon: BookOpen,
      label: { ar: 'حضور الحصص', en: 'Lesson Attendance' },
      value: metrics.lessonAttendance,
      subValue: {
        ar: 'سجل حضور',
        en: 'attendance records',
      },
      isRelevant: relevantDimensions.includes('engagement'),
      health: metrics.lessonAttendance > 0 ? 'good' : 'warning',
    });
  }

  // Focus Sessions (Meaningful only)
  if (metrics.meaningfulFocusSessions > 0 || relevantDimensions.includes('engagement')) {
    evidenceBlocks.push({
      id: 'focus',
      icon: Eye,
      label: { ar: 'جلسات تركيز فعالة', en: 'Meaningful Focus Sessions' },
      value: metrics.meaningfulFocusSessions,
      subValue: {
        ar: '> 2 دقيقة',
        en: '> 2 minutes',
      },
      isRelevant: relevantDimensions.includes('engagement'),
      health: metrics.meaningfulFocusSessions > 0 ? 'good' : 'warning',
    });
  }

  // Exam Activity
  if (metrics.totalExamAttempts > 0 || relevantDimensions.includes('examActivity')) {
    evidenceBlocks.push({
      id: 'examActivity',
      icon: ClipboardCheck,
      label: { ar: 'محاولات الامتحانات', en: 'Exam Attempts' },
      value: metrics.totalExamAttempts,
      subValue: {
        ar: `${metrics.passedExams} نجاح / ${metrics.failedExams} رسوب`,
        en: `${metrics.passedExams} passed / ${metrics.failedExams} failed`,
      },
      isRelevant: relevantDimensions.includes('examActivity') || relevantDimensions.includes('examAttempts'),
      health: metrics.totalExamAttempts > 0 
        ? (metrics.passRate >= 60 ? 'good' : metrics.passRate >= 40 ? 'warning' : 'critical')
        : 'neutral',
    });
  }

  // Pass Rate
  if (metrics.totalExamAttempts > 0 && (relevantDimensions.includes('passRate'))) {
    evidenceBlocks.push({
      id: 'passRate',
      icon: metrics.passRate >= 60 ? TrendingUp : TrendingDown,
      label: { ar: 'نسبة النجاح', en: 'Pass Rate' },
      value: `${metrics.passRate}%`,
      isRelevant: relevantDimensions.includes('passRate'),
      health: metrics.passRate >= 60 ? 'good' : metrics.passRate >= 40 ? 'warning' : 'critical',
    });
  }

  // Average Score
  if (metrics.totalExamAttempts > 0 && relevantDimensions.includes('avgScore')) {
    evidenceBlocks.push({
      id: 'avgScore',
      icon: metrics.avgExamScore >= 50 ? CheckCircle : XCircle,
      label: { ar: 'متوسط الدرجات', en: 'Average Score' },
      value: `${metrics.avgExamScore}%`,
      isRelevant: relevantDimensions.includes('avgScore'),
      health: metrics.avgExamScore >= 60 ? 'good' : metrics.avgExamScore >= 40 ? 'warning' : 'critical',
    });
  }

  if (evidenceBlocks.length === 0) {
    return (
      <div className="bg-muted/30 rounded-xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          {isRTL ? 'لا توجد بيانات كافية' : 'Insufficient data available'}
        </p>
      </div>
    );
  }

  const getHealthStyles = (health: EvidenceBlock['health']) => {
    switch (health) {
      case 'good':
        return { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20' };
      case 'warning':
        return { bg: 'bg-amber-500/10', text: 'text-amber-600', border: 'border-amber-500/20' };
      case 'critical':
        return { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20' };
      default:
        return { bg: 'bg-muted/50', text: 'text-muted-foreground', border: 'border-border' };
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        {isRTL ? 'لماذا هذه الحالة؟' : 'Why this status?'}
      </h3>
      
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {evidenceBlocks.map((block) => {
          const styles = getHealthStyles(block.health);
          const Icon = block.icon;
          
          return (
            <div
              key={block.id}
              className={cn(
                "rounded-xl border p-3 transition-all",
                block.isRelevant 
                  ? cn(styles.bg, styles.border, "ring-1 ring-offset-1", visual.dotClass.replace('bg-', 'ring-'))
                  : "bg-card border-border opacity-60"
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  block.isRelevant ? styles.bg : "bg-muted"
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    block.isRelevant ? styles.text : "text-muted-foreground"
                  )} />
                </div>
                
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {isRTL ? block.label.ar : block.label.en}
                  </p>
                  <p className={cn(
                    "text-lg font-bold",
                    block.isRelevant ? styles.text : "text-foreground"
                  )}>
                    {block.value}
                  </p>
                  {block.subValue && (
                    <p className="text-xs text-muted-foreground/80 truncate">
                      {isRTL ? block.subValue.ar : block.subValue.en}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StatusEvidenceBlocks;
