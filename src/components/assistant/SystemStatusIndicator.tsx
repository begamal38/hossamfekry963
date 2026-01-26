/**
 * System Status Indicator
 * 
 * A visual, expressive status component that communicates system state
 * primarily through color, icon, and visual hierarchy - NOT text.
 * 
 * NAVIGATION: Always routes to /assistant/reports with focusStatus state.
 * Text is secondary; status must be understandable without reading.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemStatusData } from '@/hooks/useSystemStatus';
import { 
  STATUS_VISUALS, 
  getSystemStatusText,
  type SystemStatusCode 
} from '@/lib/statusCopy';
import { Skeleton } from '@/components/ui/skeleton';

interface SystemStatusIndicatorProps {
  status: SystemStatusData;
  studentCount: number;
  isRTL: boolean;
  loading?: boolean;
  className?: string;
}

/**
 * Get the visual config for a status code
 */
function getVisualConfig(code: SystemStatusCode) {
  return STATUS_VISUALS[code] || STATUS_VISUALS.NOT_ACTIVATED;
}

export const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({
  status,
  studentCount,
  isRTL,
  loading = false,
  className,
}) => {
  const navigate = useNavigate();
  const visual = getVisualConfig(status.statusCode);
  const StatusIcon = visual.icon;
  const label = getSystemStatusText(status.statusCode, 'label', isRTL);
  const description = getSystemStatusText(status.statusCode, 'description', isRTL);

  /**
   * Status Click Handler
   * ALWAYS navigates to Reports page with focusStatus filter
   * NEVER navigates to Students page directly
   */
  const handleClick = () => {
    navigate('/assistant/reports', {
      state: { focusStatus: status.statusCode }
    });
  };

  // Loading skeleton
  if (status.loading || loading) {
    return (
      <div className={cn(
        "rounded-2xl border border-border bg-card p-4 sm:p-5",
        className
      )}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
      className={cn(
        "relative rounded-2xl border border-border bg-card overflow-hidden transition-all",
        "hover:border-primary/40 cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Status Indicator Bar - Primary Visual Signal */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2.5",
        visual.bgTintClass
      )}>
        <div className="flex items-center gap-2.5">
          {/* Pulsing Dot - Unified breathing animation */}
          <div className="relative flex items-center justify-center">
            <span className={cn(
              "absolute w-3.5 h-3.5 rounded-full animate-focus-breathe",
              visual.dotClass.replace('bg-', 'bg-').replace(/\/\d+/, '/30')
            )} />
            <span className={cn(
              "relative w-2.5 h-2.5 rounded-full animate-subtle-pulse",
              visual.dotClass
            )} />
          </div>
          
          {/* Status Icon */}
          <StatusIcon className={cn("w-4 h-4", visual.textClass)} />
          
          {/* Status Label - Short & Clear */}
          <span className={cn(
            "text-sm font-semibold",
            visual.textClass
          )}>
            {label}
          </span>
        </div>

        {/* Navigation Arrow */}
        <div className="w-6 h-6 rounded-full bg-background/60 flex items-center justify-center">
          {isRTL ? (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 py-4 sm:px-5 sm:py-5">
        {/* Numeric Insight - Evidence, Not Status */}
        <div className="flex items-center gap-3 mb-2">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-primary/10"
          )}>
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              {studentCount}
            </h2>
            <span className="text-sm text-muted-foreground">
              {isRTL ? 'طالب نشط' : 'Active Students'}
            </span>
          </div>
        </div>

        {/* Context Line - Secondary, De-emphasized */}
        <p className="text-xs sm:text-sm text-muted-foreground/80 mt-3 line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
};

export default SystemStatusIndicator;
