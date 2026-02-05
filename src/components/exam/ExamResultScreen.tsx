import React from 'react';
import { Trophy, RotateCcw, BookOpen, Layers, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface ExamResultScreenProps {
  score: number;
  total: number;
  courseId: string;
  chapterTitle?: string;
  chapterTitleAr?: string;
  lessonTitle?: string;
  lessonTitleAr?: string;
  lessonId?: string;
  onBackToCourse: () => void;
  onToPlatform: () => void;
  onReviewLesson?: () => void;
}

/**
 * ExamResultScreen - Gen Z friendly results display
 * 
 * Features:
 * - Encouraging, not academic tone
 * - Clear pass/fail without harsh colors
 * - Motivational messaging based on score tier
 * - Clear continuation CTAs (no dead ends)
 */
export const ExamResultScreen: React.FC<ExamResultScreenProps> = ({
  score,
  total,
  chapterTitle,
  chapterTitleAr,
  lessonTitle,
  lessonTitleAr,
  lessonId,
  onBackToCourse,
  onToPlatform,
  onReviewLesson,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  
  // Score tiers for messaging
  const isExcellent = percentage >= 80;
  const isPassed = percentage >= 60;
  const isAverage = percentage >= 40 && percentage < 60;
  // Below 40 = needs improvement

  // Gen Z friendly messaging based on score tier
  const getResultMessage = () => {
    if (isExcellent) {
      return {
        emoji: '🔥',
        title: isArabic ? 'أداء ممتاز!' : 'Excellent!',
        subtitle: isArabic ? 'أحسنت 👏 كمّل كده' : 'Well done! Keep it up',
        color: 'text-green-600 dark:text-green-400',
        bgColor: 'bg-green-500/10',
      };
    }
    if (isPassed) {
      return {
        emoji: '✨',
        title: isArabic ? 'نتيجة حلوة!' : 'Good job!',
        subtitle: isArabic ? 'كويس 💪 ومع المراجعة هتبقى أحسن' : 'Nice! Review to get even better',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
      };
    }
    if (isAverage) {
      return {
        emoji: '💪',
        title: isArabic ? 'لسه في فرصة!' : 'Room to grow!',
        subtitle: isArabic ? 'راجع الحصة وحاول تاني' : 'Review the lesson and try again',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-500/10',
      };
    }
    // Below average
    return {
      emoji: '📚',
      title: isArabic ? 'محتاج مراجعة' : 'Needs review',
      subtitle: isArabic ? 'ارجع للحصة وركز في النقاط الأساسية' : 'Go back to the lesson and focus on key points',
      color: 'text-muted-foreground',
      bgColor: 'bg-muted',
    };
  };

  const resultMessage = getResultMessage();
  const displayChapter = isArabic ? chapterTitleAr : chapterTitle;
  const displayLesson = isArabic ? lessonTitleAr : lessonTitle;

  return (
    <div className="container mx-auto px-4 max-w-lg py-8 content-appear">
      <Card className="text-center border-0 shadow-lg">
        <CardContent className="py-10 px-6">
          {/* Result Icon */}
          <div className={cn(
            "w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center",
            resultMessage.bgColor
          )}>
            {isPassed ? (
              <Trophy className={cn("w-10 h-10", resultMessage.color)} />
            ) : (
              <RotateCcw className={cn("w-10 h-10", resultMessage.color)} />
            )}
          </div>

          {/* Result Title - Gen Z friendly */}
          <p className="text-4xl mb-2">{resultMessage.emoji}</p>
          <h1 className={cn("text-2xl font-bold mb-1", resultMessage.color)}>
            {resultMessage.title}
          </h1>
          <p className="text-muted-foreground mb-6">
            {resultMessage.subtitle}
          </p>

          {/* Score Display - Clean, not harsh */}
          <div className="bg-muted/50 rounded-xl py-5 px-6 mb-6">
            <div className="text-4xl font-bold text-foreground tabular-nums mb-1">
              {score}/{total}
            </div>
            <div className="text-lg text-muted-foreground tabular-nums">
              {percentage}%
            </div>
          </div>

          {/* Continuation CTAs - No dead ends */}
          <div className="space-y-3">
            {/* Primary CTA based on result */}
            {!isPassed && onReviewLesson && lessonId && (
              <Button 
                onClick={onReviewLesson}
                className="w-full h-12 gap-2"
              >
                <BookOpen className="w-4 h-4" />
                {isArabic ? 'راجع الحصة' : 'Review Lesson'}
              </Button>
            )}
            
            {isPassed && (
              <Button 
                onClick={onBackToCourse}
                className="w-full h-12 gap-2"
              >
                {isArabic ? (
                  <>
                    <ArrowRight className="w-4 h-4" />
                    {displayChapter ? 'كمّل الباب' : 'كمّل الكورس'}
                  </>
                ) : (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    {displayChapter ? 'Continue Chapter' : 'Continue Course'}
                  </>
                )}
              </Button>
            )}

            {/* Secondary CTAs */}
            <Button 
              variant="outline"
              onClick={onBackToCourse}
              className="w-full h-11"
            >
              <Layers className={cn("w-4 h-4", isArabic ? "ml-2" : "mr-2")} />
              {isArabic ? 'العودة للكورس' : 'Back to Course'}
            </Button>
            
            <Button 
              variant="ghost"
              onClick={onToPlatform}
              className="w-full h-10 text-muted-foreground"
            >
              {isArabic ? 'للمنصة' : 'To Platform'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Context Card - Where they are in the journey */}
      {(displayChapter || displayLesson) && (
        <Card className="mt-5 border-border/50">
          <CardContent className="py-4 text-center">
            <p className="text-sm text-muted-foreground">
              {displayChapter && (
                <span className="flex items-center justify-center gap-2">
                  <Layers className="w-4 h-4" />
                  {displayChapter}
                </span>
              )}
              {displayLesson && (
                <span className="block mt-1 text-xs">
                  {displayLesson}
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
