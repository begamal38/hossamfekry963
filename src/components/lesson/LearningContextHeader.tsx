/**
 * Learning Context Header
 * 
 * Displays chapter-level context at the top of lesson lists.
 * Teaches the learning model: Lessons belong to Chapters.
 * 
 * ARCHITECTURE:
 * - Consumes chapter progress from RPC (no new calculations)
 * - i18n for bilingual support (AR/EN)
 * - Visual progress indicator
 */

import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Layers, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LearningContextHeaderProps {
  chapterTitle: string;
  chapterTitleAr: string;
  chapterIndex: number; // 0-based
  totalChapters: number;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  className?: string;
}

export function LearningContextHeader({
  chapterTitle,
  chapterTitleAr,
  chapterIndex,
  totalChapters,
  completedLessons,
  totalLessons,
  progressPercent,
  className,
}: LearningContextHeaderProps) {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';

  // Chapter position text (1-indexed for display)
  const positionText = isArabic
    ? `أنت حاليًا في الباب ${chapterIndex + 1} من أصل ${totalChapters}`
    : `You are currently studying Chapter ${chapterIndex + 1} of ${totalChapters}`;

  // Progress status text
  const progressText = isArabic
    ? `${completedLessons} من ${totalLessons} حصة مكتملة`
    : `${completedLessons} of ${totalLessons} lessons completed`;

  return (
    <div
      className={cn(
        "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 md:p-5",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Chapter Title */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold truncate">
            {isArabic ? chapterTitleAr : chapterTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {positionText}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="w-4 h-4" />
            {progressText}
          </span>
          <span className="font-medium text-primary">
            {progressPercent}%
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Learning Model Hint */}
      <p className="text-xs text-muted-foreground mt-3 opacity-75">
        {isArabic
          ? '💡 كل باب يحتوي على مجموعة حصص مترابطة'
          : '💡 Each chapter contains a set of connected lessons'}
      </p>
    </div>
  );
}
