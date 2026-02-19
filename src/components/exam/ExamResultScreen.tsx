import React, { useEffect, useState } from 'react';
import { Trophy, RotateCcw, BookOpen, Layers, ArrowLeft, ArrowRight, ClipboardList, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RecommendedLesson {
  id: string;
  title: string;
  title_ar: string;
  course_id: string;
}

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
  onReviewAnswers?: () => void;
}

export const ExamResultScreen: React.FC<ExamResultScreenProps> = ({
  score,
  total,
  courseId,
  chapterTitle,
  chapterTitleAr,
  lessonTitle,
  lessonTitleAr,
  lessonId,
  onBackToCourse,
  onToPlatform,
  onReviewLesson,
  onReviewAnswers,
}) => {
  const { isRTL } = useLanguage();
  const isArabic = isRTL;
  const { user } = useAuth();
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const isExcellent = percentage >= 80;
  const isPassed = percentage >= 60;
  const isAverage = percentage >= 40 && percentage < 60;

  // Post-exam lesson recommendations (only for students who didn't pass)
  const [recommendations, setRecommendations] = useState<RecommendedLesson[]>([]);

  useEffect(() => {
    if (!user || !courseId || isPassed) return;
    const fetchRecommendations = async () => {
      try {
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, title, title_ar, course_id')
          .eq('course_id', courseId)
          .eq('is_active', true)
          .order('order_index')
          .limit(20);

        if (!lessons || lessons.length === 0) return;

        const { data: completions } = await supabase
          .from('lesson_completions')
          .select('lesson_id')
          .eq('user_id', user.id);

        const completedIds = new Set((completions || []).map(c => c.lesson_id));
        const uncompleted = lessons.filter(l => !completedIds.has(l.id));
        setRecommendations(uncompleted.slice(0, 3));
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      }
    };
    fetchRecommendations();
  }, [user, courseId, isPassed]);

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
    <div className="container mx-auto px-4 max-w-lg py-8 pb-[120px] md:pb-8 content-appear">
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

          <p className="text-4xl mb-2">{resultMessage.emoji}</p>
          <h1 className={cn("text-2xl font-bold mb-1", resultMessage.color)}>
            {resultMessage.title}
          </h1>
          <p className="text-muted-foreground mb-6">
            {resultMessage.subtitle}
          </p>

          {/* Score Display */}
          <div className="bg-muted/50 rounded-xl py-5 px-6 mb-6">
            <div className="text-4xl font-bold text-foreground tabular-nums mb-1">
              {score}/{total}
            </div>
            <div className="text-lg text-muted-foreground tabular-nums">
              {percentage}%
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            {!isPassed && onReviewLesson && lessonId && (
              <Button onClick={onReviewLesson} className="w-full h-12 gap-2">
                <BookOpen className="w-4 h-4" />
                {isArabic ? 'راجع الحصة' : 'Review Lesson'}
              </Button>
            )}

            {isPassed && (
              <Button onClick={onBackToCourse} className="w-full h-12 gap-2">
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

            {onReviewAnswers && (
              <Button variant="outline" onClick={onReviewAnswers} className="w-full h-11 gap-2">
                <ClipboardList className="w-4 h-4" />
                {isArabic ? 'مراجعة الإجابات' : 'Review Answers'}
              </Button>
            )}

            <Button variant="outline" onClick={onBackToCourse} className="w-full h-11">
              <Layers className={cn("w-4 h-4", isArabic ? "ml-2" : "mr-2")} />
              {isArabic ? 'العودة للكورس' : 'Back to Course'}
            </Button>

            <Button variant="ghost" onClick={onToPlatform} className="w-full h-10 text-muted-foreground">
              {isArabic ? 'للمنصة' : 'To Platform'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Post-exam recommendations for students who didn't pass */}
      {recommendations.length > 0 && (
        <Card className="mt-5 border-amber-500/20 bg-amber-500/5">
          <CardContent className="py-4 px-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">
                {isArabic ? 'حصص مقترحة للمراجعة' : 'Suggested Lessons to Review'}
              </h3>
            </div>
            <div className="space-y-2">
              {recommendations.map(lesson => (
                <button
                  key={lesson.id}
                  onClick={() => window.location.href = `/lessons/${lesson.id}`}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-card border border-border/60 hover:border-primary/50 transition-colors text-start"
                >
                  <BookOpen className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">
                    {isArabic ? lesson.title_ar : lesson.title}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Card */}
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
                <span className="block mt-1 text-xs">{displayLesson}</span>
              )}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
