import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressRingProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Size of the ring in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Show percentage text inside */
  showPercentage?: boolean;
  /** Label below percentage */
  label?: string;
  /** Additional class names */
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 80,
  strokeWidth = 6,
  showPercentage = true,
  label,
  className,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  const getProgressColor = () => {
    if (progress >= 80) return 'stroke-green-500';
    if (progress >= 50) return 'stroke-primary';
    if (progress >= 25) return 'stroke-amber-500';
    return 'stroke-muted-foreground';
  };

  return (
    <div className={cn("relative inline-flex flex-col items-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/30"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={cn("transition-all duration-500 ease-out", getProgressColor())}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      
      {/* Center content */}
      {showPercentage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-foreground">{progress}%</span>
        </div>
      )}
      
      {/* Label below ring */}
      {label && (
        <span className="text-xs text-muted-foreground mt-2 text-center">{label}</span>
      )}
    </div>
  );
};
