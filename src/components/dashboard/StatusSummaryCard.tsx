import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface StatusSummaryCardProps {
  /** Primary status line (e.g., course name, active count) */
  primaryText: string;
  /** Secondary status line (e.g., chapter name, pending actions) */
  secondaryText?: string;
  /** Progress percentage (0-100) */
  progress?: number;
  /** Optional badge text */
  badge?: string;
  /** Badge variant */
  badgeVariant?: 'default' | 'success' | 'warning' | 'accent';
  /** Link destination */
  href?: string;
  /** RTL mode */
  isRTL?: boolean;
  /** Additional class names */
  className?: string;
}

const badgeStyles = {
  default: 'bg-primary/10 text-primary',
  success: 'bg-green-500/10 text-green-600',
  warning: 'bg-amber-500/10 text-amber-600',
  accent: 'bg-purple-500/10 text-purple-600',
};

export const StatusSummaryCard: React.FC<StatusSummaryCardProps> = ({
  primaryText,
  secondaryText,
  progress,
  badge,
  badgeVariant = 'default',
  href,
  isRTL = false,
  className,
}) => {
  const content = (
    <div
      className={cn(
        "relative bg-gradient-to-br from-primary/5 via-card to-accent/5 rounded-2xl border border-border p-4 sm:p-5",
        href && "hover:border-primary/40 transition-colors cursor-pointer",
        className
      )}
    >
      {/* Top row: Badge + Arrow */}
      <div className="flex items-center justify-between mb-3">
        {badge && (
          <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", badgeStyles[badgeVariant])}>
            {badge}
          </span>
        )}
        {href && (
          <div className="w-7 h-7 rounded-full bg-muted/60 flex items-center justify-center">
            {isRTL ? (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>

      {/* Primary Text */}
      <h2 className="text-lg sm:text-xl font-bold text-foreground mb-1 line-clamp-1">
        {primaryText}
      </h2>

      {/* Secondary Text */}
      {secondaryText && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
          {secondaryText}
        </p>
      )}

      {/* Progress Bar */}
      {typeof progress === 'number' && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">
              {isRTL ? 'التقدم' : 'Progress'}
            </span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};
