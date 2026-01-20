/**
 * Reports Status Header
 * 
 * Visual status summary for the Reports page, showing the current
 * system status with filtering context when navigated from dashboard.
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  STATUS_VISUALS, 
  getSystemStatusText,
  type SystemStatusCode 
} from '@/lib/statusCopy';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportsStatusHeaderProps {
  focusStatus: SystemStatusCode | null;
  onClearFilter: () => void;
  isRTL: boolean;
}

/**
 * Maps status codes to relevant analytics focus areas
 */
const STATUS_FOCUS_MAP: Record<SystemStatusCode, { 
  focusArea: { ar: string; en: string };
  filterKey: string;
}> = {
  STABLE: {
    focusArea: { ar: 'نظرة عامة على الأداء الممتاز', en: 'Overview of excellent performance' },
    filterKey: 'all',
  },
  NEEDS_EXAM_FOLLOWUP: {
    focusArea: { ar: 'الطلاب المحتاجين متابعة الامتحانات', en: 'Students needing exam follow-up' },
    filterKey: 'exam_gaps',
  },
  UNSTABLE_RESULTS: {
    focusArea: { ar: 'المناطق التي تحتاج ضبط', en: 'Areas requiring adjustment' },
    filterKey: 'low_engagement',
  },
  HIGH_FAILURE_RATE: {
    focusArea: { ar: 'تحليل نسب الرسوب', en: 'Failure rate analysis' },
    filterKey: 'high_failure',
  },
  CRITICAL_PASS_RATE: {
    focusArea: { ar: 'تحليل نسب النجاح الحرجة', en: 'Critical pass rate analysis' },
    filterKey: 'critical',
  },
  NOT_ACTIVATED: {
    focusArea: { ar: 'بيانات النظام', en: 'System data' },
    filterKey: 'all',
  },
  NO_STUDENTS_OR_ENROLLMENTS: {
    focusArea: { ar: 'بيانات النظام', en: 'System data' },
    filterKey: 'all',
  },
  DATA_LOAD_ERROR: {
    focusArea: { ar: 'بيانات النظام', en: 'System data' },
    filterKey: 'all',
  },
};

export const ReportsStatusHeader: React.FC<ReportsStatusHeaderProps> = ({
  focusStatus,
  onClearFilter,
  isRTL,
}) => {
  if (!focusStatus) return null;

  const visual = STATUS_VISUALS[focusStatus] || STATUS_VISUALS.NOT_ACTIVATED;
  const StatusIcon = visual.icon;
  const label = getSystemStatusText(focusStatus, 'label', isRTL);
  const description = getSystemStatusText(focusStatus, 'description', isRTL);
  const focusInfo = STATUS_FOCUS_MAP[focusStatus];
  const focusArea = isRTL ? focusInfo.focusArea.ar : focusInfo.focusArea.en;

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden mb-4",
        visual.bgTintClass.replace('/10', '/5'),
        "border-l-4",
        visual.dotClass.replace('bg-', 'border-l-')
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Status Icon */}
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
              visual.bgTintClass
            )}>
              <StatusIcon className={cn("w-5 h-5", visual.textClass)} />
            </div>

            <div>
              {/* Filter Context */}
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-sm font-semibold",
                  visual.textClass
                )}>
                  {label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isRTL ? '- تصفية نشطة' : '- Active Filter'}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-2">
                {description}
              </p>

              {/* Focus Area */}
              <div className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {isRTL ? 'التركيز على:' : 'Focusing on:'}{' '}
                  <span className="font-medium text-foreground">{focusArea}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Clear Filter Button */}
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 h-8 w-8"
            onClick={onClearFilter}
            title={isRTL ? 'إزالة الفلتر' : 'Clear filter'}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReportsStatusHeader;
