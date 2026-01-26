import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamTimerProps {
  remainingSeconds: number;
  totalSeconds: number;
  className?: string;
}

/**
 * ExamTimer - Calm timer display with progressive urgency
 * 
 * Behavior:
 * - Neutral by default (muted colors)
 * - Subtle warning at last 20% (amber)
 * - Red only at last 5% (urgent but not aggressive)
 * - No flashing or aggressive animations
 * - Respects reduced-motion preferences
 */
export const ExamTimer: React.FC<ExamTimerProps> = ({
  remainingSeconds,
  totalSeconds,
  className,
}) => {
  const { isRTL } = useLanguage();
  
  // Calculate percentage remaining
  const percentRemaining = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;
  
  // Determine urgency level
  const isWarning = percentRemaining <= 20 && percentRemaining > 5;
  const isCritical = percentRemaining <= 5;

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        "border transition-all duration-150 ease-out",
        "motion-reduce:transition-none",
        isCritical 
          ? "bg-destructive/10 border-destructive/30 text-destructive"
          : isWarning
            ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
            : "bg-muted/50 border-muted text-muted-foreground",
        className
      )}
    >
      {/* Clock icon with subtle pulse at critical */}
      <Clock className={cn(
        "w-4 h-4 transition-colors duration-300",
        isCritical && "animate-[subtle-pulse_1s_ease-in-out_infinite] motion-reduce:animate-none"
      )} />

      {/* Time display */}
      <span className={cn(
        "text-sm font-medium tabular-nums transition-colors duration-300",
        isCritical && "font-bold"
      )}>
        {formatTime(remainingSeconds)}
      </span>

      {/* Remaining label */}
      <span className="text-xs opacity-70">
        {isRTL ? 'متبقي' : 'left'}
      </span>
    </div>
  );
};
