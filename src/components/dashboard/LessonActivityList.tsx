import React from 'react';
import { CheckCircle2, Circle, Clock, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface LessonActivity {
  id: string;
  title: string;
  courseName: string;
  isCompleted: boolean;
  isLastAccessed?: boolean;
  timeSpent?: string;
}

interface LessonActivityListProps {
  lessons: LessonActivity[];
  isRTL?: boolean;
  onLessonClick?: (lessonId: string) => void;
}

export const LessonActivityList: React.FC<LessonActivityListProps> = ({
  lessons,
  isRTL,
  onLessonClick,
}) => {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <Circle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">
          {isRTL ? 'لا توجد دروس بعد' : 'No lessons yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className={cn(
            "flex items-center gap-4 p-4 rounded-lg border transition-colors",
            lesson.isLastAccessed 
              ? "bg-primary/5 border-primary/20" 
              : "bg-card border-border hover:bg-muted/50"
          )}
        >
          <div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
              lesson.isCompleted 
                ? "bg-success/10 text-success" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {lesson.isCompleted ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Circle className="w-5 h-5" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground truncate">{lesson.title}</h4>
              {lesson.isLastAccessed && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {isRTL ? 'آخر درس' : 'Last accessed'}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{lesson.courseName}</p>
          </div>
          
          {lesson.timeSpent && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{lesson.timeSpent}</span>
            </div>
          )}
          
          {!lesson.isCompleted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLessonClick?.(lesson.id)}
              className="flex-shrink-0"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};
