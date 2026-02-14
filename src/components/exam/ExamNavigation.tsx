import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  answers: Record<string, string>;
  questionIds: string[];
  submitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onJumpTo: (index: number) => void;
}

/**
 * ExamNavigation - Bottom navigation bar for exam
 * 
 * Features:
 * - Fixed at bottom on mobile
 * - Previous/Next/Submit buttons
 * - Question dot indicators
 */
export const ExamNavigation: React.FC<ExamNavigationProps> = ({
  currentIndex,
  totalQuestions,
  answers,
  questionIds,
  submitting,
  onPrevious,
  onNext,
  onSubmit,
  onJumpTo,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const isLastQuestion = currentIndex === totalQuestions - 1;
  const isFirstQuestion = currentIndex === 0;

  return (
    <div className="fixed left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t bottom-[88px] md:bottom-0 safe-area-bottom">
      <div className="container mx-auto px-4 py-3 max-w-2xl">
        {/* Question Indicators - Scrollable */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-hide justify-center">
          {questionIds.map((qId, idx) => (
            <button
              key={qId}
              onClick={() => onJumpTo(idx)}
              className={cn(
                "w-8 h-8 rounded-full text-xs font-medium transition-all shrink-0",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                currentIndex === idx
                  ? "bg-primary text-primary-foreground scale-110"
                  : answers[qId]
                    ? "bg-green-500/20 text-green-700 dark:text-green-400"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground"
              )}
            >
              {idx + 1}
            </button>
          ))}
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={isFirstQuestion}
            className="flex-1 gap-2 h-12"
          >
            <ArrowRight className={cn("w-4 h-4", !isRTL && "rotate-180")} />
            {isArabic ? 'السابق' : 'Previous'}
          </Button>

          {isLastQuestion ? (
            <Button
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 gap-2 h-12 bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="w-4 h-4" />
              {submitting 
                ? (isArabic ? 'جاري الحفظ...' : 'Saving...')
                : (isArabic ? 'إنهاء الامتحان' : 'Submit Exam')
              }
            </Button>
          ) : (
            <Button
              onClick={onNext}
              className="flex-1 gap-2 h-12"
            >
              {isArabic ? 'التالي' : 'Next'}
              <ArrowLeft className={cn("w-4 h-4", !isRTL && "rotate-180")} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
