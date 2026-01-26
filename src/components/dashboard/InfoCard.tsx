import React from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export type InfoCardVariant = 'primary' | 'success' | 'warning' | 'muted';

interface InfoCardProps {
  /** Icon for the card */
  icon: LucideIcon;
  /** Primary value/text */
  value: string | number;
  /** Label below the value */
  label: string;
  /** Optional subtext with context */
  subtext?: string;
  /** Color variant using design system tokens */
  variant?: InfoCardVariant;
  /** Link destination */
  href?: string;
  /** RTL mode */
  isRTL?: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Additional class names */
  className?: string;
}

// Unified variant styles using semantic design tokens
const variantStyles: Record<InfoCardVariant, { bg: string; icon: string }> = {
  primary: {
    bg: 'bg-primary/10',
    icon: 'text-primary',
  },
  success: {
    bg: 'bg-success/10',
    icon: 'text-success',
  },
  warning: {
    bg: 'bg-warning/10',
    icon: 'text-warning',
  },
  muted: {
    bg: 'bg-muted',
    icon: 'text-muted-foreground',
  },
};

export const InfoCard: React.FC<InfoCardProps> = ({
  icon: Icon,
  value,
  label,
  subtext,
  variant = 'primary',
  href,
  isRTL = false,
  compact = false,
  className,
}) => {
  const styles = variantStyles[variant];

  const content = (
    <div
      className={cn(
        // Unified card styling
        "bg-card rounded-lg border border-border/50 p-3 sm:p-4 transition-all duration-150",
        href && "hover:border-primary/30 cursor-pointer active:scale-[0.98]",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Icon Container - UNIFIED: 44x44px square with 12px radius */}
          <div className={cn(
            "w-11 h-11 rounded-[12px] flex items-center justify-center mb-3",
            styles.bg
          )}>
            <Icon className={cn("w-5 h-5", styles.icon)} strokeWidth={2} />
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
          <div className="flex-shrink-0 ms-2">
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
