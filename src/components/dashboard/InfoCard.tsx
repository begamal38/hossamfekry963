import React from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface InfoCardProps {
  /** Icon for the card */
  icon: LucideIcon;
  /** Primary value/text */
  value: string | number;
  /** Label below the value */
  label: string;
  /** Optional subtext with context */
  subtext?: string;
  /** Icon/badge color */
  color?: string;
  /** Background color for icon */
  bgColor?: string;
  /** Link destination */
  href?: string;
  /** RTL mode */
  isRTL?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  value,
  label,
  subtext,
  color = 'text-primary',
  bgColor = 'bg-primary/10',
  href,
  isRTL = false,
  compact = false,
  className,
}) => {
  const content = (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border/50 p-3 sm:p-4 transition-all duration-150 shadow-card",
        href && "hover:border-primary/30 hover:shadow-elevated cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Icon - unified rounded-xl */}
          <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-2.5", bgColor)}>
            <Icon className={cn("w-4.5 h-4.5", color)} />
          </div>

          {/* Value */}
          <p className={cn("font-bold text-foreground truncate", compact ? "text-xl" : "text-2xl sm:text-3xl")}>
            {value}
          </p>

          {/* Label */}
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {label}
          </p>

          {/* Subtext */}
          {subtext && (
            <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1 line-clamp-1">
              {subtext}
            </p>
          )}
        </div>

        {/* Arrow indicator for links */}
        {href && (
          <div className="flex-shrink-0 ml-2">
            {isRTL ? (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link to={href}>{content}</Link>;
  }

  return content;
};
