import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamFocusIndicatorProps {
  isActive?: boolean;
  className?: string;
}

/**
 * ExamFocusIndicator - Subtle exam mode indicator
 * 
 * Design:
 * - Rich green pulse (#22C55E) when active
 * - Calm 2s breathing animation
 * - RTL/LTR aware
 * - Respects reduced-motion preferences
 * 
 * Purpose:
 * - Shows student is in exam mode
 * - Non-distracting, calm visual cue
 */
export const ExamFocusIndicator: React.FC<ExamFocusIndicatorProps> = ({
  isActive = true,
  className,
}) => {
  const { isRTL } = useLanguage();

  if (!isActive) return null;

  return (
    <div 
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2 rounded-lg",
        "bg-card/90 backdrop-blur-md border",
        "transition-all duration-150 ease-out",
        "border-[hsl(142_71%_45%/0.25)]",
        "motion-reduce:transition-none",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Breathing pulse dot - Unified green animation */}
      <span className="relative flex items-center justify-center">
        <span 
          className={cn(
            "absolute inline-flex h-4 w-4 rounded-full",
            "bg-[hsl(142_71%_45%/0.25)]",
            "animate-focus-breathe",
            "motion-reduce:animate-none"
          )}
        />
        <span 
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full",
            "bg-[#22C55E]",
            "animate-subtle-pulse",
            "motion-reduce:animate-none"
          )}
        />
      </span>

      {/* Exam icon */}
      <FileText className="w-4 h-4 text-[#22C55E]" />

      {/* Status text */}
      <span className="text-sm font-medium text-[#22C55E]">
        {isRTL ? 'وضع الامتحان مفعل' : 'Exam Mode Active'}
      </span>

      {/* Eye indicator */}
      <Eye className={cn(
        "w-4 h-4 text-[#22C55E]",
        "animate-[subtle-pulse_4s_ease-in-out_infinite]",
        "motion-reduce:animate-none"
      )} />
    </div>
  );
};
