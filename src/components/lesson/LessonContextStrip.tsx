/**
 * Lesson Context Strip
 * 
 * A compact visual strip at the top of the Lesson Page.
 * Reconnects the lesson to the chapter/course hierarchy.
 * 
 * ARCHITECTURE:
 * - Consumes existing chapter data (no new fetches)
 * - i18n for bilingual support (AR/EN)
 * - Clear "Back to Chapter" affordance
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';
import { Layers, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LessonContextStripProps {
  // Chapter info
  chapterId?: string;
  chapterTitle: string;
  chapterTitleAr: string;
  chapterProgress?: number; // 0-100
  
  // Lesson position
  lessonPosition: number; // 1-indexed
  totalLessonsInChapter: number;
  
  // Course info for navigation
  courseSlug: string;
  courseId: string;
  
  className?: string;
}

export function LessonContextStrip({
  chapterId,
  chapterTitle,
  chapterTitleAr,
  chapterProgress = 0,
  lessonPosition,
  totalLessonsInChapter,
  courseSlug,
  courseId,
  className,
}: LessonContextStripProps) {
  const { language, isRTL } = useLanguage();
  const isArabic = language === 'ar';
  
  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  // Position text
  const positionText = isArabic
    ? `الحصة ${lessonPosition} من ${totalLessonsInChapter}`
    : `Lesson ${lessonPosition} of ${totalLessonsInChapter}`;

  const courseUrl = `/course/${courseSlug || courseId}`;

  return (
    <div
      className={cn(
        "bg-muted/50 border-b",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Chapter Info with Link */}
          <Link 
            to={courseUrl}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
              <Layers className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {isArabic ? chapterTitleAr : chapterTitle}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <ChevronIcon className="w-3 h-3" />
                {isArabic ? 'العودة للباب' : 'Back to Chapter'}
              </span>
            </div>
          </Link>

          {/* Lesson Position + Chapter Progress */}
          <div className="flex items-center gap-4">
            {/* Lesson Position Badge */}
            <div className="flex items-center gap-1.5 bg-card border rounded-full px-3 py-1.5">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">
                {positionText}
              </span>
            </div>

            {/* Mini Progress Indicator (desktop only) */}
            <div className="hidden sm:flex items-center gap-2 min-w-[120px]">
              <Progress value={chapterProgress} className="h-1.5 flex-1" />
              <span className="text-xs text-muted-foreground w-8 text-right">
                {chapterProgress}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
