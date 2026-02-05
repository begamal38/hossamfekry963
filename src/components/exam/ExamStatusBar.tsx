import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamStatusBarProps {
  title: string;
  chapterTitle?: string;
  currentQuestion: number;
  totalQuestions: number;
  onBack: () => void;
}

/**
 * ExamStatusBar - Fixed top bar for exam page
 * 
 * Contains:
 * - Exam title
 * - Progress indicator (Question X / Total)
 * - Back button
 */
export const ExamStatusBar: React.FC<ExamStatusBarProps> = ({
  title,
  chapterTitle,
  currentQuestion,
  totalQuestions,
  onBack,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
      {/* Spacer for navbar */}
      <div className="h-16" />
      
      <div className="container mx-auto px-4 py-3 max-w-2xl">
        {/* Title Row */}
        <div className="flex items-center gap-3 mb-3">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onBack}
            className="shrink-0 h-9 w-9"
          >
            <ArrowLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </Button>
          
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold truncate">{title}</h1>
            {chapterTitle && (
              <p className="text-xs text-muted-foreground truncate">{chapterTitle}</p>
            )}
          </div>
          
          {/* Progress Badge */}
          <div className="shrink-0 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {isArabic ? 'سؤال' : 'Q'}
            </span>
            <span className="font-bold text-primary tabular-nums">
              {currentQuestion + 1}
            </span>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium tabular-nums">{totalQuestions}</span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <Progress value={progress} className="h-1.5" />
      </div>
    </div>
  );
};
