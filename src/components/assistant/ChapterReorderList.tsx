/**
 * Chapter Reorder List
 * 
 * Manual reordering for chapters using up/down controls.
 * Reuses the same UX pattern as LessonReorderList.
 * Persists order immediately to database via order_index.
 * 
 * IMPORTANT: This only affects DISPLAY ORDER.
 * No impact on progress, focus mode, or enrollments.
 */

import React, { useState } from 'react';
import { ChevronUp, ChevronDown, BookOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Chapter {
  id: string;
  title: string;
  title_ar: string;
  order_index: number;
  lessons_count?: number;
}

interface ChapterReorderListProps {
  chapters: Chapter[];
  onReorderComplete: () => void;
  isRTL: boolean;
  isArabic: boolean;
}

export const ChapterReorderList: React.FC<ChapterReorderListProps> = ({
  chapters,
  onReorderComplete,
  isRTL,
  isArabic,
}) => {
  const [reordering, setReordering] = useState<string | null>(null);

  /**
   * Move chapter up or down in the list
   */
  const handleMove = async (chapterId: string, direction: 'up' | 'down') => {
    const currentIndex = chapters.findIndex(c => c.id === chapterId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    // Validate bounds
    if (targetIndex < 0 || targetIndex >= chapters.length) return;

    const currentChapter = chapters[currentIndex];
    const targetChapter = chapters[targetIndex];

    setReordering(chapterId);

    try {
      // Swap order_index values
      const [{ error: error1 }, { error: error2 }] = await Promise.all([
        supabase
          .from('chapters')
          .update({ order_index: targetChapter.order_index })
          .eq('id', currentChapter.id),
        supabase
          .from('chapters')
          .update({ order_index: currentChapter.order_index })
          .eq('id', targetChapter.id),
      ]);

      if (error1 || error2) throw error1 || error2;

      toast.success(isArabic ? 'تم تحديث الترتيب' : 'Order updated');
      onReorderComplete();
    } catch (error) {
      console.error('Error reordering chapters:', error);
      toast.error(isArabic ? 'فشل في تحديث الترتيب' : 'Failed to update order');
    } finally {
      setReordering(null);
    }
  };

  /**
   * Normalize all order indices (fix gaps)
   */
  const handleNormalize = async () => {
    if (chapters.length === 0) return;

    setReordering('normalize');

    try {
      const updates = chapters.map((chapter, index) => ({
        id: chapter.id,
        order_index: index,
      }));

      // Update all chapters with normalized indices
      for (const update of updates) {
        const { error } = await supabase
          .from('chapters')
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
  const hasGaps = chapters.some((c, i) => c.order_index !== i);

  if (chapters.length === 0) {
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

      {/* Chapter List */}
      <div className="space-y-2">
        {chapters.map((chapter, index) => {
          const isFirst = index === 0;
          const isLast = index === chapters.length - 1;
          const isMoving = reordering === chapter.id;

          return (
            <div
              key={chapter.id}
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
                  onClick={() => handleMove(chapter.id, 'up')}
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  disabled={isLast || !!reordering}
                  onClick={() => handleMove(chapter.id, 'down')}
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Order Number */}
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground tabular-nums">
                {index + 1}
              </div>

              {/* Chapter Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="font-medium text-sm truncate">
                    {isArabic ? chapter.title_ar : chapter.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {chapter.lessons_count !== undefined && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {chapter.lessons_count} {isArabic ? 'حصة' : 'lessons'}
                    </Badge>
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
          ? 'استخدم الأسهم لتغيير ترتيب الأبواب. التغييرات تُحفظ تلقائياً.'
          : 'Use arrows to reorder chapters. Changes are saved automatically.'}
      </p>
    </div>
  );
};

export default ChapterReorderList;
