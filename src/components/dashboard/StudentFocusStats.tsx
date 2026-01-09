import React from 'react';
import { Eye, Clock, Zap, AlertTriangle, TrendingUp, Target } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FocusStatsData {
  totalSessions: number;
  totalActiveMinutes: number;
  totalPausedMinutes: number;
  completedSegments: number;
  totalInterruptions: number;
  uniqueLessonsWatched: number;
  avgSessionMinutes: number;
}

interface StudentFocusStatsProps {
  stats: FocusStatsData;
  totalLessonsEnrolled: number;
  isArabic: boolean;
}

export const StudentFocusStats: React.FC<StudentFocusStatsProps> = ({
  stats,
  totalLessonsEnrolled,
  isArabic,
}) => {
  const focusPercentage = totalLessonsEnrolled > 0 
    ? Math.min(100, Math.round((stats.uniqueLessonsWatched / totalLessonsEnrolled) * 100))
    : 0;

  // Determine focus quality based on interruptions ratio
  const interruptionRatio = stats.totalSessions > 0 
    ? stats.totalInterruptions / stats.totalSessions 
    : 0;
  
  const focusQuality: 'excellent' | 'good' | 'needsWork' = 
    interruptionRatio < 2 ? 'excellent' :
    interruptionRatio < 5 ? 'good' : 'needsWork';

  const qualityConfig = {
    excellent: {
      ar: 'تركيز ممتاز',
      en: 'Excellent Focus',
      color: 'text-green-600',
      bgColor: 'bg-green-600',
    },
    good: {
      ar: 'تركيز جيد',
      en: 'Good Focus',
      color: 'text-amber-600',
      bgColor: 'bg-amber-600',
    },
    needsWork: {
      ar: 'يحتاج تحسين',
      en: 'Needs Improvement',
      color: 'text-red-600',
      bgColor: 'bg-red-600',
    },
  };

  return (
    <div className="bg-card rounded-lg sm:rounded-xl border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <h3 className="font-semibold text-foreground flex items-center gap-1.5 text-sm sm:text-base">
          <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          {isArabic ? 'إحصائيات التركيز' : 'Focus Stats'}
        </h3>
        <Badge 
          variant="outline" 
          className={cn("text-[10px] sm:text-xs gap-1 px-1.5 sm:px-2", qualityConfig[focusQuality].color)}
        >
          <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          {isArabic 
            ? qualityConfig[focusQuality].ar 
            : qualityConfig[focusQuality].en}
        </Badge>
      </div>

      {/* Focus Coverage Progress */}
      <div className="mb-3 sm:mb-4">
        <div className="flex justify-between text-xs sm:text-sm mb-1.5">
          <span className="text-muted-foreground">
            {isArabic ? 'تغطية المشاهدة' : 'Viewing Coverage'}
          </span>
          <span className="font-semibold">{focusPercentage}%</span>
        </div>
        <Progress 
          value={focusPercentage} 
          className={cn(
            "h-2 sm:h-3",
            focusPercentage >= 70 && "[&>div]:bg-green-500",
            focusPercentage >= 40 && focusPercentage < 70 && "[&>div]:bg-amber-500",
            focusPercentage < 40 && "[&>div]:bg-red-500"
          )}
        />
        <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
          {isArabic 
            ? `${stats.uniqueLessonsWatched} / ${totalLessonsEnrolled} حصة`
            : `${stats.uniqueLessonsWatched} / ${totalLessonsEnrolled} lessons`}
        </p>
      </div>

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto text-primary mb-0.5" />
          <p className="text-base sm:text-xl font-bold text-foreground">
            {stats.totalActiveMinutes}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'دقيقة' : 'Minutes'}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
          <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto text-amber-500 mb-0.5" />
          <p className="text-base sm:text-xl font-bold text-foreground">
            {stats.completedSegments}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'فترات' : 'Segments'}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
          <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto text-green-500 mb-0.5" />
          <p className="text-base sm:text-xl font-bold text-foreground">
            {stats.avgSessionMinutes}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'متوسط' : 'Average'}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-2 sm:p-3 text-center">
          <AlertTriangle className={cn(
            "w-3.5 h-3.5 sm:w-4 sm:h-4 mx-auto mb-0.5",
            stats.totalInterruptions > 10 ? "text-red-500" : "text-muted-foreground"
          )} />
          <p className="text-base sm:text-xl font-bold text-foreground">
            {stats.totalInterruptions}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'انقطاعات' : 'Interrupts'}
          </p>
        </div>
      </div>

      {/* Tip - Hidden on small mobile */}
      <div className="mt-3 p-2 rounded-lg bg-primary/5 border border-primary/10 hidden sm:block">
        <p className="text-xs text-muted-foreground">
          💡 {isArabic 
            ? 'شاهد من داخل الموقع دائماً لتسجيل تقدمك!'
            : 'Always watch from inside the website to track progress!'}
        </p>
      </div>
    </div>
  );
};
