import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle2, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LessonExamIndicatorProps {
  examId: string;
  examTitle: string;
  examTitleAr: string;
  hasAttempted: boolean;
  attemptScore?: number;
  attemptTotal?: number;
  isArabic: boolean;
  className?: string;
}

/**
 * LessonExamIndicator - Friendly exam awareness for lesson page
 * 
 * Shows:
 * - "في امتحان على الحصة دي 📝" when exam exists (not attempted)
 * - "تم أداء الامتحان ✔" when already attempted
 * 
 * Design:
 * - Non-blocking, visible but calm
 * - Brand colors (indigo primary)
 * - Gen Z friendly Arabic copy
 */
export const LessonExamIndicator: React.FC<LessonExamIndicatorProps> = ({
  examId,
  examTitle,
  examTitleAr,
  hasAttempted,
  attemptScore,
  attemptTotal,
  isArabic,
  className,
}) => {
  const navigate = useNavigate();

  const displayTitle = isArabic ? examTitleAr : examTitle;
  const percentage = attemptTotal && attemptScore !== undefined 
    ? Math.round((attemptScore / attemptTotal) * 100) 
    : 0;
  const passed = percentage >= 60;

  if (hasAttempted) {
    // Completed state - calm, celebratory
    return (
      <div className={cn(
        "flex items-center justify-between gap-4 p-4 rounded-xl border transition-all",
        passed 
          ? "bg-green-500/5 border-green-500/20" 
          : "bg-amber-500/5 border-amber-500/20",
        className
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            passed ? "bg-green-500/10" : "bg-amber-500/10"
          )}>
            <CheckCircle2 className={cn(
              "w-5 h-5",
              passed ? "text-green-500" : "text-amber-500"
            )} />
          </div>
          <div>
            <p className="font-medium text-foreground">
              {isArabic ? 'تم أداء الامتحان ✔' : 'Exam Completed ✔'}
            </p>
            <p className="text-sm text-muted-foreground">
              {displayTitle} • {attemptScore}/{attemptTotal} ({percentage}%)
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/exam/${examId}`)}
          className="shrink-0"
        >
          {isArabic ? 'عرض النتيجة' : 'View Result'}
        </Button>
      </div>
    );
  }

  // Not attempted - motivational, Gen Z friendly
  return (
    <div className={cn(
      "flex items-center justify-between gap-4 p-4 rounded-xl border transition-all",
      "bg-primary/5 border-primary/20",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">
            {isArabic ? 'في امتحان على الحصة دي 📝' : 'This lesson has an exam 📝'}
          </p>
          <p className="text-sm text-muted-foreground">
            {displayTitle}
          </p>
        </div>
      </div>
      <Button
        size="sm"
        onClick={() => navigate(`/exam/${examId}`)}
        className="shrink-0 gap-1.5"
      >
        <Play className="w-4 h-4" />
        {isArabic ? 'جاهز تشوف مستواك؟' : 'Test yourself'}
      </Button>
    </div>
  );
};
