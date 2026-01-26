import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamProgressIndicatorProps {
  currentQuestion: number;
  totalQuestions: number;
  className?: string;
}

/**
 * ExamProgressIndicator - Simple, calm progress display
 * 
 * Design:
 * - Shows "سؤال X من Y" format
 * - Smooth transitions on question change
 * - Neutral colors (no stress-inducing red/green)
 */
export const ExamProgressIndicator: React.FC<ExamProgressIndicatorProps> = ({
  currentQuestion,
  totalQuestions,
  className,
}) => {
  const { isRTL } = useLanguage();
  const progress = totalQuestions > 0 ? (currentQuestion / totalQuestions) * 100 : 0;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Text indicator */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {isRTL ? 'سؤال' : 'Question'}{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {currentQuestion}
          </span>{' '}
          {isRTL ? 'من' : 'of'}{' '}
          <span className="font-semibold text-foreground tabular-nums">
            {totalQuestions}
          </span>
        </span>
        
        <span className="text-xs text-muted-foreground tabular-nums">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar - Neutral color, smooth transition */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            "bg-muted-foreground/40"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
