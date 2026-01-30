/**
 * Status Context Header
 * 
 * Top section of Reports page that answers: "What is the system state right now?"
 * Shows visual status indicator, translated label, and short explanation.
 * NO numbers here - just status context.
 */

import React from 'react';
import { X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  type SystemStatusCode, 
  STATUS_VISUALS,
  getSystemStatusText 
} from '@/lib/statusCopy';

interface ReportsStatusHeaderProps {
  statusCode: SystemStatusCode;
  isRTL: boolean;
  /** Whether this is a filtered view from dashboard navigation */
  isFiltered?: boolean;
  /** Callback to clear filter */
  onClearFilter?: () => void;
  /** Dismiss the header card (owner state lives in the page) */
  onDismiss?: () => void;
  /** When true, show the dismiss button (X) */
  dismissible?: boolean;
  /** Visual state for exit animation before unmount */
  state?: 'open' | 'closing';
}

export const ReportsStatusHeader: React.FC<ReportsStatusHeaderProps> = ({
  statusCode,
  isRTL,
  isFiltered = false,
  onClearFilter,
  onDismiss,
  dismissible = true,
  state = 'open',
}) => {
  const visual = STATUS_VISUALS[statusCode];
  const StatusIcon = visual.icon;
  const label = getSystemStatusText(statusCode, 'label', isRTL);
  const description = getSystemStatusText(statusCode, 'description', isRTL);

  return (
    <div
      className={cn(
        "rounded-lg border overflow-hidden mb-4",
        state === 'open' ? 'content-appear' : 'animate-out fade-out-0',
        visual.bgTintClass,
        "border-l-4",
        visual.dotClass.replace('bg-', 'border-l-')
      )}
      style={state === 'closing' ? { animationDuration: '180ms' } : undefined}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {/* Status Icon - NO pulsing dot here (dot is only on Dashboard indicator) */}
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              visual.bgTintClass
            )}>
              <StatusIcon className={cn("w-6 h-6", visual.textClass)} />
            </div>

            <div className="pt-0.5">
              {/* Status Label */}
              <div className="flex items-center gap-2 mb-1">
                <span className={cn(
                  "text-lg font-bold",
                  visual.textClass
                )}>
                  {label}
                </span>
                {isFiltered && (
                  <span className="text-xs bg-background/60 px-2 py-0.5 rounded-full text-muted-foreground">
                    {isRTL ? 'تصفية نشطة' : 'Active Filter'}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">
                {description}
              </p>

              {/* Context hint */}
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground/70">
                <Info className="w-3 h-3" />
                <span>
                  {isRTL 
                    ? 'هذه الحالة مبنية على البيانات الفعلية أدناه' 
                    : 'This status is derived from the actual data below'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Dismiss Button (X) - single owner state in page */}
          {dismissible && onDismiss && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-8 w-8"
              onClick={onDismiss}
              title={isRTL ? 'إغلاق' : 'Close'}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsStatusHeader;
