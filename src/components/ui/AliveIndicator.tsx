import React from 'react';
import { cn } from '@/lib/utils';

interface AliveIndicatorProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
}

export const AliveIndicator: React.FC<AliveIndicatorProps> = ({
  className,
  size = 'sm',
  showLabel = false,
  label = 'متصل',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="relative flex">
        {/* Outer glow ring - breathing animation */}
        <span 
          className={cn(
            "absolute inline-flex rounded-full bg-primary/30 animate-[alive-breathe_7s_ease-in-out_infinite]",
            sizeClasses[size]
          )}
          style={{
            transform: 'scale(1.8)',
            opacity: 0.4,
          }}
        />
        {/* Inner dot - solid */}
        <span 
          className={cn(
            "relative inline-flex rounded-full bg-primary",
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
