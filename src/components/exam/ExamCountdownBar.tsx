import React from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamCountdownBarProps {
  remainingSeconds: number;
  totalSeconds: number;
  percentRemaining: number;
  className?: string;
}

/**
 * ExamCountdownBar - Fixed sticky timer bar for exam
 * 
 * Color behavior:
 * - Green: > 50% remaining
 * - Orange: 10-50% remaining
 * - Red: < 10% (last ~2 min for a 20-min exam)
 */
export const ExamCountdownBar: React.FC<ExamCountdownBarProps> = ({
  remainingSeconds,
  totalSeconds,
  percentRemaining,
  className,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;

  const isWarning = percentRemaining <= 50 && percentRemaining > 10;
  const isCritical = percentRemaining <= 10;

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-lg border transition-colors duration-300",
      isCritical
        ? "bg-destructive/10 border-destructive/30"
        : isWarning
          ? "bg-amber-500/10 border-amber-500/30"
          : "bg-green-500/10 border-green-500/30",
      className
    )}>
      <Clock className={cn(
        "w-4 h-4 shrink-0",
        isCritical
          ? "text-destructive"
          : isWarning
            ? "text-amber-600 dark:text-amber-400"
            : "text-green-600 dark:text-green-400"
      )} />

      <div className="flex-1 min-w-0">
        <Progress 
          value={percentRemaining} 
          className={cn(
            "h-1.5",
            isCritical && "[&>div]:bg-destructive",
            isWarning && "[&>div]:bg-amber-500",
            !isCritical && !isWarning && "[&>div]:bg-green-500"
          )}
        />
      </div>

      <span className={cn(
        "text-sm font-bold tabular-nums shrink-0",
        isCritical
          ? "text-destructive"
          : isWarning
            ? "text-amber-600 dark:text-amber-400"
            : "text-green-600 dark:text-green-400"
      )}>
        {formatTime(remainingSeconds)}
      </span>

      <span className={cn(
        "text-xs shrink-0 opacity-70",
        isCritical
          ? "text-destructive"
          : isWarning
            ? "text-amber-600 dark:text-amber-400"
            : "text-green-600 dark:text-green-400"
      )}>
        {isArabic ? 'متبقي' : 'left'}
      </span>
    </div>
  );
};
