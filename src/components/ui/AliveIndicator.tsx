import React from 'react';
import { cn } from '@/lib/utils';

interface AliveIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

/**
 * Alive Indicator - Unified green breathing pulse
 * Shows system is live/active near the logo
 * Uses rich green (#22C55E) with calm 2s breathing animation
 * Desktop-only by default (hidden on mobile for performance)
 */
export const AliveIndicator: React.FC<AliveIndicatorProps> = ({
  className,
  size = 'sm',
  showLabel = false,
  label = 'متصل',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const glowSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex items-center justify-center">
        {/* Outer glow ring - Rich green breathing animation */}
        <span 
          className={cn(
            "absolute inline-flex rounded-full",
            "bg-[hsl(142_71%_45%/0.35)]",
            "animate-[alive-breathe_2s_ease-in-out_infinite]",
            "motion-reduce:animate-none",
            glowSizeClasses[size]
          )}
        />
        {/* Inner dot - solid rich green with subtle glow */}
        <span 
          className={cn(
            "relative inline-flex rounded-full",
            "bg-[#22C55E]",
            "animate-[alive-dot-pulse_2s_ease-in-out_infinite]",
            "motion-reduce:animate-none",
            sizeClasses[size]
          )}
        />
      </span>
      {showLabel && (
        <span className="text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  );
};
