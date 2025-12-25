import React from 'react';
import { Play, BookOpen } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { LessonStatusBadge, LessonStatus } from './LessonStatusBadge';
import { cn } from '@/lib/utils';

interface CourseProgressCardProps {
  title: string;
  completedLessons: number;
  totalLessons: number;
  isRTL?: boolean;
  onContinue?: () => void;
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  title,
  completedLessons,
  totalLessons,
  isRTL,
  onContinue,
}) => {
  const progressPercent = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  const getStatus = (): LessonStatus => {
    if (progressPercent === 100) return 'completed';
    if (progressPercent > 0) return 'in_progress';
    return 'not_started';
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground line-clamp-1">{title}</h4>
            <p className="text-sm text-muted-foreground">
              {completedLessons}/{totalLessons} {isRTL ? 'درس' : 'lessons'}
            </p>
          </div>
        </div>
        <LessonStatusBadge status={getStatus()} isRTL={isRTL} />
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{isRTL ? 'التقدم' : 'Progress'}</span>
          <span className="font-medium text-foreground">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      
      {progressPercent < 100 && (
        <Button 
          onClick={onContinue} 
          className="w-full gap-2"
          variant={progressPercent === 0 ? 'default' : 'outline'}
        >
          <Play className="w-4 h-4" />
          {progressPercent === 0 
            ? (isRTL ? 'ابدأ الآن' : 'Start Now')
            : (isRTL ? 'متابعة' : 'Continue')
          }
        </Button>
      )}
    </div>
  );
};
