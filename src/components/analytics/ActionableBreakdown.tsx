/**
 * Actionable Breakdown Component
 * 
 * Shows which dimension is failing and what needs attention.
 * Based on statusCode - this is FILTERED analytics, not advice.
 * 
 * This component answers: "What specifically needs fixing?"
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  ArrowRight,
  ArrowLeft,
  Users,
  ClipboardCheck,
  Eye,
  TrendingDown,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  type SystemStatusCode, 
  STATUS_VISUALS,
  getSystemStatusText 
} from '@/lib/statusCopy';
import { type SystemStatusMetrics } from '@/hooks/useSystemStatus';

interface ActionableBreakdownProps {
  statusCode: SystemStatusCode;
  metrics: SystemStatusMetrics | null;
  isRTL: boolean;
}

interface ActionItem {
  id: string;
  dimension: { ar: string; en: string };
  impact: { ar: string; en: string };
  action: { ar: string; en: string };
  affectedCount: number;
  route?: string;
  severity: 'critical' | 'warning' | 'info';
}

/**
 * Generates action items based on status code and metrics.
 * NO business logic here - just mapping status to UI.
 */
function getActionItems(
  statusCode: SystemStatusCode, 
  metrics: SystemStatusMetrics | null
): ActionItem[] {
  if (!metrics) return [];

  const items: ActionItem[] = [];

  switch (statusCode) {
    case 'NOT_ACTIVATED':
      if (metrics.meaningfulFocusSessions === 0 && metrics.lessonAttendance === 0) {
        items.push({
          id: 'no-engagement',
          dimension: { ar: 'مفيش تفاعل', en: 'No Engagement' },
          impact: { ar: 'الطلاب مشتركين بس مش بيتفاعلوا', en: 'Students enrolled but not engaging' },
          action: { ar: 'أرسل رسالة ترحيب أو تذكير', en: 'Send welcome message or reminder' },
          affectedCount: metrics.totalStudents,
          route: '/assistant/send-notifications',
          severity: 'critical',
        });
      }
      break;

    case 'NO_STUDENTS_OR_ENROLLMENTS':
      items.push({
        id: 'no-students',
        dimension: { ar: 'مفيش طلاب', en: 'No Students' },
        impact: { ar: 'المنصة فاضية', en: 'Platform is empty' },
        action: { ar: 'أضف طلاب أو فعّل اشتراكات', en: 'Add students or activate enrollments' },
        affectedCount: 0,
        route: '/assistant/enrollments',
        severity: 'critical',
      });
      break;

    case 'CRITICAL_PASS_RATE':
    case 'HIGH_FAILURE_RATE':
      items.push({
        id: 'exam-failure',
        dimension: { ar: 'نسبة الرسوب', en: 'Failure Rate' },
        impact: { ar: `${metrics.failedExams} طالب رسبوا`, en: `${metrics.failedExams} students failed` },
        action: { ar: 'راجع صعوبة الامتحانات أو أضف شرح', en: 'Review exam difficulty or add explanations' },
        affectedCount: metrics.failedExams,
        route: '/assistant/exam-results',
        severity: 'critical',
      });

      if (metrics.avgExamScore < 40) {
        items.push({
          id: 'low-scores',
          dimension: { ar: 'درجات متدنية', en: 'Low Scores' },
          impact: { ar: `متوسط ${metrics.avgExamScore}% فقط`, en: `Only ${metrics.avgExamScore}% average` },
          action: { ar: 'تواصل مع الطلاب الأضعف', en: 'Reach out to struggling students' },
          affectedCount: metrics.totalExamAttempts,
          route: '/assistant/students',
          severity: 'critical',
        });
      }
      break;

    case 'UNSTABLE_RESULTS':
      items.push({
        id: 'unstable-exams',
        dimension: { ar: 'نتائج غير مستقرة', en: 'Unstable Results' },
        impact: { ar: `نسبة النجاح ${metrics.passRate}%`, en: `${metrics.passRate}% pass rate` },
        action: { ar: 'راجع الطلاب اللي درجاتهم متذبذبة', en: 'Review students with inconsistent scores' },
        affectedCount: metrics.failedExams,
        route: '/assistant/exam-results',
        severity: 'warning',
      });
      break;

    case 'NEEDS_EXAM_FOLLOWUP':
      const watchingNotTesting = metrics.meaningfulFocusSessions;
      items.push({
        id: 'exam-followup',
        dimension: { ar: 'متابعة الامتحانات', en: 'Exam Follow-up' },
        impact: { ar: 'طلاب بيتفاعلوا بس مش بيمتحنوا', en: 'Students engaging but not testing' },
        action: { ar: 'شجعهم يحلوا الامتحانات', en: 'Encourage them to take exams' },
        affectedCount: watchingNotTesting,
        route: '/assistant/students',
        severity: 'warning',
      });
      break;

    case 'STABLE':
      // No action items needed for stable status
      break;

    case 'DATA_LOAD_ERROR':
      items.push({
        id: 'data-error',
        dimension: { ar: 'خطأ في البيانات', en: 'Data Error' },
        impact: { ar: 'فشل تحميل البيانات', en: 'Failed to load data' },
        action: { ar: 'أعد تحميل الصفحة', en: 'Refresh the page' },
        affectedCount: 0,
        severity: 'critical',
      });
      break;
  }

  return items;
}

export const ActionableBreakdown: React.FC<ActionableBreakdownProps> = ({
  statusCode,
  metrics,
  isRTL,
}) => {
  const navigate = useNavigate();
  const actionItems = getActionItems(statusCode, metrics);
  const visual = STATUS_VISUALS[statusCode];

  // Don't show for stable status
  if (statusCode === 'STABLE') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
        <p className="text-sm text-green-700 dark:text-green-400 font-medium">
          {isRTL ? '✅ المنصة شغالة صح — مفيش حاجة محتاجة تدخل' : '✅ Platform is healthy — no action required'}
        </p>
      </div>
    );
  }

  if (actionItems.length === 0) {
    return null;
  }

  const getSeverityStyles = (severity: ActionItem['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          icon: 'bg-red-500/20 text-red-600',
          button: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/20',
          icon: 'bg-amber-500/20 text-amber-600',
          button: 'bg-amber-600 hover:bg-amber-700 text-white',
        };
      default:
        return {
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          icon: 'bg-blue-500/20 text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700 text-white',
        };
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
        <Zap className="w-4 h-4" />
        {isRTL ? 'إيه اللي محتاج يتصلح؟' : 'What needs fixing?'}
      </h3>

      <div className="space-y-2">
        {actionItems.map((item) => {
          const styles = getSeverityStyles(item.severity);
          const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

          return (
            <div
              key={item.id}
              className={cn(
                "rounded-xl border p-3",
                styles.bg,
                styles.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                  styles.icon
                )}>
                  <AlertTriangle className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold">
                      {isRTL ? item.dimension.ar : item.dimension.en}
                    </span>
                    {item.affectedCount > 0 && (
                      <span className="text-xs bg-background/60 px-1.5 py-0.5 rounded-full">
                        {item.affectedCount} {isRTL ? 'متأثر' : 'affected'}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {isRTL ? item.impact.ar : item.impact.en}
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-medium">
                      <Zap className="w-3 h-3" />
                      <span>{isRTL ? item.action.ar : item.action.en}</span>
                    </div>

                    {item.route && (
                      <Button
                        size="sm"
                        className={cn("h-7 px-2 text-xs", styles.button)}
                        onClick={() => navigate(item.route!)}
                      >
                        {isRTL ? 'اذهب' : 'Go'}
                        <ArrowIcon className="w-3 h-3 ms-1" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionableBreakdown;
