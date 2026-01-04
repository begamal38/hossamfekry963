import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VisitorPreviewCountdownProps {
  remainingSeconds: number;
  isRunning: boolean;
  className?: string;
}

/**
 * Countdown timer for visitor preview - shows remaining time in Arabic
 * Visible ONLY to visitors (not logged in) during free lesson preview
 */
export const VisitorPreviewCountdown: React.FC<VisitorPreviewCountdownProps> = ({
  remainingSeconds,
  isRunning,
  className,
}) => {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Warning state when less than 1 minute remains
  const isWarning = remainingSeconds <= 60;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
        "border transition-all duration-300",
        isRunning 
          ? isWarning
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-primary/10 border-primary/30 text-primary"
          : "bg-muted/50 border-muted text-muted-foreground",
        className
      )}
    >
      <Clock className={cn(
        "w-4 h-4",
        isRunning && !isWarning && "animate-pulse"
      )} />
      <span dir="rtl">
        المتبقي من المعاينة: {formattedTime}
      </span>
    </div>
  );
};
