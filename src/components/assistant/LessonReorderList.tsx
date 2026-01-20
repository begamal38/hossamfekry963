/**
 * Lesson Reorder List
 * 
 * Manual drag & drop reordering for lessons with simple up/down controls.
 * Persists order immediately to database.
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, GripVertical, Video, Clock, Youtube, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Lesson {
  id: string;
  title: string;
  title_ar: string;
  order_index: number;
  video_url: string | null;
  duration_minutes: number | null;
  is_free_lesson: boolean;
  chapter_id: string | null;
}

interface LessonReorderListProps {
  lessons: Lesson[];
  onReorderComplete: () => void;
  isRTL: boolean;
  isArabic: boolean;
  getChapterName: (chapterId: string | null) => string | null;
}

export const LessonReorderList: React.FC<LessonReorderListProps> = ({
  lessons,
  onReorderComplete,
  isRTL,
  isArabic,
  getChapterName,
}) => {
  const [reordering, setReordering] = useState<string | null>(null);

  /**
   * Move lesson up or down in the list
   */
  const handleMove = async (lessonId: string, direction: 'up' | 'down') => {
    const currentIndex = lessons.findIndex(l => l.id === lessonId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Validate bounds
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const currentLesson = lessons[currentIndex];
    const targetLesson = lessons[targetIndex];

    setReordering(lessonId);

    try {
      // Swap order_index values
      const [{ error: error1 }, { error: error2 }] = await Promise.all([
        supabase
          .from('lessons')
          .update({ order_index: targetLesson.order_index })
          .eq('id', currentLesson.id),
        supabase
          .from('lessons')
          .update({ order_index: currentLesson.order_index })
          .eq('id', targetLesson.id),
      ]);

      if (error1 || error2) throw error1 || error2;

      toast.success(isArabic ? 'تم تحديث الترتيب' : 'Order updated');
      onReorderComplete();
    } catch (error) {
      console.error('Error reordering lessons:', error);
      toast.error(isArabic ? 'فشل في تحديث الترتيب' : 'Failed to update order');
    } finally {
      setReordering(null);
    }
  };

  /**
   * Normalize all order indices (fix gaps)
   */
  const handleNormalize = async () => {
    if (lessons.length === 0) return;

    setReordering('normalize');

    try {
      const updates = lessons.map((lesson, index) => ({
        id: lesson.id,
        order_index: index,
      }));

      // Update all lessons with normalized indices
      for (const update of updates) {
        const { error } = await supabase
          .from('lessons')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      toast.success(isArabic ? 'تم ضبط الترتيب' : 'Order normalized');
      onReorderComplete();
    } catch (error) {
      console.error('Error normalizing order:', error);
      toast.error(isArabic ? 'فشل في ضبط الترتيب' : 'Failed to normalize order');
    } finally {
      setReordering(null);
    }
  };

  // Check if order has gaps
  const hasGaps = lessons.some((l, i) => l.order_index !== i);

  if (lessons.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Normalize Button - Show only if there are gaps */}
      {hasGaps && (
        <div className="flex justify-end mb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleNormalize}
            disabled={reordering === 'normalize'}
            className="text-xs"
          >
            {reordering === 'normalize' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            {isArabic ? 'ضبط الترتيب' : 'Fix Order'}
          </Button>
        </div>
      )}

      {/* Lesson List */}
      <div className="space-y-2">
        {lessons.map((lesson, index) => {
          const isFirst = index === 0;
          const isLast = index === lessons.length - 1;
          const isMoving = reordering === lesson.id;

          return (
            <div
              key={lesson.id}
              className={cn(
                "flex items-center gap-2 p-3 rounded-xl border bg-card transition-all",
                isMoving && "opacity-60 scale-[0.98]"
              )}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Order Controls */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isFirst || !!reordering}
                  onClick={() => handleMove(lesson.id, 'up')}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isLast || !!reordering}
                  onClick={() => handleMove(lesson.id, 'down')}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Order Number */}
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                {index + 1}
              </div>

              {/* Lesson Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Video className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="font-medium text-sm truncate">
                    {isArabic ? lesson.title_ar : lesson.title}
                  </span>
                  {lesson.is_free_lesson && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-200">
                      {isArabic ? 'مجانية' : 'Free'}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {getChapterName(lesson.chapter_id) && (
                    <span className="truncate max-w-[120px]">
                      {getChapterName(lesson.chapter_id)}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {lesson.duration_minutes || 60}{isArabic ? 'د' : 'm'}
                  </span>
                  {lesson.video_url && (
                    <Youtube className="h-3 w-3 text-red-500" />
                  )}
                </div>
              </div>

              {/* Loading indicator */}
              {isMoving && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          );
        })}
      </div>

      {/* Help Text */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        {isArabic 
          ? 'استخدم الأسهم لتغيير ترتيب الحصص. التغييرات تُحفظ تلقائياً.'
          : 'Use arrows to reorder lessons. Changes are saved automatically.'}
      </p>
    </div>
  );
};

export default LessonReorderList;
