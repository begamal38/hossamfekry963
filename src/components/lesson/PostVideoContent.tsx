import React from 'react';
import { 
  BookOpen, 
  Lightbulb, 
  StickyNote, 
  ChevronRight, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface KeyPoint {
  text: string;
  text_ar: string;
}

interface PostVideoContentProps {
  summary?: string;
  summary_ar?: string;
  keyPoints?: KeyPoint[];
  assistantNotes?: string;
  assistantNotes_ar?: string;
  hasLinkedExam?: boolean;
  examTitle?: string;
  examTitle_ar?: string;
  onTakeExam?: () => void;
  onContinueToNext?: () => void;
  hasNextLesson?: boolean;
  isCompleted?: boolean;
  onMarkComplete?: () => void;
}

export function PostVideoContent({
  summary,
  summary_ar,
  keyPoints = [],
  assistantNotes,
  assistantNotes_ar,
  hasLinkedExam,
  examTitle,
  examTitle_ar,
  onTakeExam,
  onContinueToNext,
  hasNextLesson,
  isCompleted,
  onMarkComplete,
}: PostVideoContentProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const displaySummary = isRTL ? summary_ar : summary;
  const displayNotes = isRTL ? assistantNotes_ar : assistantNotes;
  const displayExamTitle = isRTL ? examTitle_ar : examTitle;

  const hasContent = displaySummary || keyPoints.length > 0 || displayNotes;

  if (!hasContent && !hasLinkedExam && !hasNextLesson) return null;

  return (
    <div className="space-y-6 mt-8">
      {/* Summary Section */}
      {displaySummary && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <BookOpen className="h-5 w-5 text-primary" />
            {isRTL ? 'ملخص الدرس' : 'Lesson Summary'}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{displaySummary}</p>
        </div>
      )}

      {/* Key Points Section */}
      {keyPoints.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            {isRTL ? 'النقاط الرئيسية' : 'Key Points'}
          </h3>
          <ul className="space-y-3">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-foreground">
                  {isRTL ? point.text_ar : point.text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assistant Notes Section */}
      {displayNotes && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-6">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <StickyNote className="h-5 w-5 text-accent" />
            {isRTL ? 'ملاحظات المدرس' : 'Teacher Notes'}
          </h3>
          <p className="text-muted-foreground leading-relaxed">{displayNotes}</p>
        </div>
      )}

      {/* CTAs Section */}
      <div className={cn(
        "flex flex-wrap gap-4 pt-4",
        isRTL ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Mark Complete Button */}
        {!isCompleted && onMarkComplete && (
          <Button
            variant="outline"
            onClick={onMarkComplete}
            className="gap-2 border-green-500/50 text-green-600 hover:bg-green-500/10"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isRTL ? 'تحديد كمكتمل' : 'Mark as Complete'}
          </Button>
        )}

        {isCompleted && (
          <Badge variant="secondary" className="bg-green-500/10 text-green-600 gap-1">
            <CheckCircle2 className="h-4 w-4" />
            {isRTL ? 'مكتمل' : 'Completed'}
          </Badge>
        )}

        {/* Take Exam Button */}
        {hasLinkedExam && onTakeExam && (
          <Button onClick={onTakeExam} className="gap-2">
            <FileText className="h-4 w-4" />
            {isRTL ? 'ابدأ الامتحان' : 'Take Exam'}
            {displayExamTitle && (
              <span className="text-primary-foreground/70">: {displayExamTitle}</span>
            )}
          </Button>
        )}

        {/* Continue to Next Lesson */}
        {hasNextLesson && onContinueToNext && (
          <Button variant="outline" onClick={onContinueToNext} className="gap-2">
            {isRTL ? 'الدرس التالي' : 'Next Lesson'}
            <ChevronRight className={cn("h-4 w-4", isRTL && "rotate-180")} />
          </Button>
        )}
      </div>
    </div>
  );
}
