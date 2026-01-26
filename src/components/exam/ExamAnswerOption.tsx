import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ExamAnswerOptionProps {
  optionKey: 'a' | 'b' | 'c' | 'd';
  optionText: string;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
}

/**
 * ExamAnswerOption - Answer selection with soft confirmation feedback
 * 
 * Design:
 * - Soft selection animation (~300ms)
 * - No correctness indication during exam
 * - Confirmation-only visual feedback
 * - Accessible focus states
 * - Respects reduced-motion preferences
 */
export const ExamAnswerOption: React.FC<ExamAnswerOptionProps> = ({
  optionKey,
  optionText,
  isSelected,
  onSelect,
  disabled = false,
  className,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleSelect = () => {
    if (disabled) return;
    
    // Trigger confirmation animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    onSelect();
  };

  const optionLabels = {
    a: 'أ',
    b: 'ب',
    c: 'ج',
    d: 'د',
  };

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={disabled}
      className={cn(
        "w-full flex items-start gap-3 p-4 rounded-xl text-start",
        "border-2 transition-all duration-200 ease-out",
        "motion-reduce:transition-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02]",
        isAnimating && "scale-[0.98] motion-reduce:scale-100",
        disabled && "opacity-60 cursor-not-allowed",
        className
      )}
    >
      {/* Option letter badge */}
      <span className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        "text-sm font-bold transition-all duration-300",
        isSelected
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      )}>
        {optionLabels[optionKey]}
      </span>

      {/* Option text */}
      <span className={cn(
        "flex-1 text-sm leading-relaxed pt-1",
        isSelected ? "text-foreground font-medium" : "text-foreground/80"
      )}>
        {optionText}
      </span>

      {/* Selection indicator - appears on selection */}
      {isSelected && (
        <span className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full mt-1",
          "bg-primary flex items-center justify-center",
          "animate-[scale-in_0.2s_ease-out] motion-reduce:animate-none"
        )}>
          <svg 
            className="w-3 h-3 text-primary-foreground" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
      )}
    </button>
  );
};
