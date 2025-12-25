import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface OverallProgressCardProps {
  progressPercent: number;
  isRTL?: boolean;
  className?: string;
}

export const OverallProgressCard: React.FC<OverallProgressCardProps> = ({
  progressPercent,
  isRTL,
  className,
}) => {
  const getProgressColor = () => {
    if (progressPercent >= 80) return 'text-success';
    if (progressPercent >= 50) return 'text-primary';
    if (progressPercent >= 20) return 'text-warning';
    return 'text-muted-foreground';
  };

  return (
    <div className={cn("bg-card rounded-xl border border-border p-6", className)}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">
          {isRTL ? 'التقدم الإجمالي' : 'Overall Progress'}
        </h3>
      </div>
      
      <div className="flex items-end gap-3 mb-4">
        <span className={cn("text-4xl font-bold", getProgressColor())}>
          {progressPercent}%
        </span>
        <span className="text-muted-foreground text-sm pb-1">
          {isRTL ? 'مكتمل' : 'complete'}
        </span>
      </div>
      
      <Progress value={progressPercent} className="h-3" />
      
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  );
};
