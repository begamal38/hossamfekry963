/**
 * Progress Impact Section
 * 
 * Explains why completing the lesson matters to the student.
 * Read-only, uses existing chapter/exam data.
 * 
 * ARCHITECTURE:
 * - No new calculations or metrics
 * - i18n for bilingual support (AR/EN)
 * - System awareness without pressure
 */

import React from 'react';
import { CheckCircle2, Trophy, Target, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface ProgressImpactSectionProps {
  // Chapter context
  hasChapter: boolean;
  chapterTitle?: string;
  chapterTitleAr?: string;
  
  // Progress context
  remainingLessonsInChapter?: number;
  hasChapterExam?: boolean;
  
  // Lesson context
  isCompleted: boolean;
  
  className?: string;
}

export function ProgressImpactSection({
  hasChapter,
  chapterTitle,
  chapterTitleAr,
  remainingLessonsInChapter = 0,
  hasChapterExam = false,
  isCompleted,
  className,
}: ProgressImpactSectionProps) {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  // Don't show if lesson is already completed
  if (isCompleted) return null;

  // Build impact messages based on context
  const messages: Array<{ icon: React.ReactNode; text: string }> = [];

  // Always show: Lesson contributes to chapter
  if (hasChapter) {
    messages.push({
      icon: <Target className="w-4 h-4 text-primary" />,
      text: isArabic
        ? 'إكمال هذه الحصة يساهم في تقدمك في الباب'
        : 'Completing this lesson contributes to your chapter progress',
    });
  }

  // If chapter has exam, mention it
  if (hasChapterExam && remainingLessonsInChapter > 0) {
    messages.push({
      icon: <Trophy className="w-4 h-4 text-amber-500" />,
      text: isArabic
        ? `بعد إكمال ${remainingLessonsInChapter} حصة متبقية، هيتفتح امتحان الباب`
        : `After ${remainingLessonsInChapter} more lesson${remainingLessonsInChapter > 1 ? 's' : ''}, the chapter exam will unlock`,
    });
  } else if (hasChapterExam && remainingLessonsInChapter === 0) {
    messages.push({
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      text: isArabic
        ? 'هذه آخر حصة! بعد إكمالها، هيتفتح امتحان الباب'
        : 'This is the last lesson! Completing it will unlock the chapter exam',
    });
  }

  // No messages to show
  if (messages.length === 0) return null;

  return (
    <div
      className={cn(
        "bg-primary/5 border border-primary/10 rounded-xl p-4",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">
          {isArabic ? 'تأثير إكمال الحصة' : 'Lesson Impact'}
        </span>
      </div>

      {/* Messages */}
      <ul className="space-y-2">
        {messages.map((msg, idx) => (
          <li key={idx} className="flex items-start gap-2.5 text-sm text-muted-foreground">
            <span className="mt-0.5 shrink-0">{msg.icon}</span>
            <span>{msg.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
