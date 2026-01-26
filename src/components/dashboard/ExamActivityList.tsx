import React from 'react';
import { CheckCircle2, Circle, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ExamActivity {
  id: string;
  title: string;
  courseName: string;
  isAttempted: boolean;
  score?: number;
  maxScore?: number;
  canRetake?: boolean;
}

interface ExamActivityListProps {
  exams: ExamActivity[];
  isRTL?: boolean;
  onTakeExam?: (examId: string) => void;
  onRetakeExam?: (examId: string) => void;
}

export const ExamActivityList: React.FC<ExamActivityListProps> = ({
  exams,
  isRTL,
  onTakeExam,
  onRetakeExam,
}) => {
  if (exams.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">
          {isRTL ? 'لا توجد امتحانات بعد' : 'No exams yet'}
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number, maxScore: number) => {
    const percent = (score / maxScore) * 100;
    if (percent >= 80) return 'text-success';
    if (percent >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-2">
      {exams.map((exam) => (
        <div
          key={exam.id}
          className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors duration-150"
        >
          <div
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
              exam.isAttempted 
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {exam.isAttempted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">{exam.title}</h4>
            <p className="text-sm text-muted-foreground truncate">{exam.courseName}</p>
          </div>
          
          {exam.isAttempted && exam.score !== undefined && exam.maxScore !== undefined ? (
            <div className="text-end">
              <p className={cn("font-bold", getScoreColor(exam.score, exam.maxScore))}>
                {exam.score}/{exam.maxScore}
              </p>
              <p className="text-xs text-muted-foreground">
                {Math.round((exam.score / exam.maxScore) * 100)}%
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded-full">
              {isRTL ? 'لم يُجرَ' : 'Not taken'}
            </span>
          )}
          
          {!exam.isAttempted ? (
            <Button
              size="sm"
              onClick={() => onTakeExam?.(exam.id)}
            >
              {isRTL ? 'ابدأ' : 'Take'}
            </Button>
          ) : exam.canRetake ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRetakeExam?.(exam.id)}
              className="gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              {isRTL ? 'إعادة' : 'Retake'}
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
};
