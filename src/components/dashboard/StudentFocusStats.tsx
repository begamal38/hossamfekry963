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
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          {isArabic ? 'إحصائيات التركيز الفعلي' : 'Real Focus Stats'}
        </h3>
        <Badge 
          variant="outline" 
          className={cn("text-xs gap-1", qualityConfig[focusQuality].color)}
        >
          <Target className="w-3 h-3" />
          {isArabic 
            ? qualityConfig[focusQuality].ar 
            : qualityConfig[focusQuality].en}
        </Badge>
      </div>

      {/* Focus Coverage Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {isArabic ? 'تغطية المشاهدة الفعلية' : 'Actual Viewing Coverage'}
          </span>
          <span className="font-semibold">{focusPercentage}%</span>
        </div>
        <Progress 
          value={focusPercentage} 
          className={cn(
            "h-3",
            focusPercentage >= 70 && "[&>div]:bg-green-500",
            focusPercentage >= 40 && focusPercentage < 70 && "[&>div]:bg-amber-500",
            focusPercentage < 40 && "[&>div]:bg-red-500"
          )}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {isArabic 
            ? `${stats.uniqueLessonsWatched} حصة من ${totalLessonsEnrolled} تمت مشاهدتها فعلياً`
            : `${stats.uniqueLessonsWatched} of ${totalLessonsEnrolled} lessons actually watched`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Clock className="w-4 h-4 mx-auto text-primary mb-1" />
          <p className="text-xl font-bold text-foreground">
            {stats.totalActiveMinutes}
          </p>
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'دقيقة تركيز' : 'Focus Minutes'}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <Zap className="w-4 h-4 mx-auto text-amber-500 mb-1" />
          <p className="text-xl font-bold text-foreground">
            {stats.completedSegments}
          </p>
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'فترات 20 دقيقة' : '20-min Segments'}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <TrendingUp className="w-4 h-4 mx-auto text-green-500 mb-1" />
          <p className="text-xl font-bold text-foreground">
            {stats.avgSessionMinutes}
          </p>
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'متوسط/جلسة' : 'Avg per Session'}
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <AlertTriangle className={cn(
            "w-4 h-4 mx-auto mb-1",
            stats.totalInterruptions > 10 ? "text-red-500" : "text-muted-foreground"
          )} />
          <p className="text-xl font-bold text-foreground">
            {stats.totalInterruptions}
          </p>
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'انقطاعات' : 'Interruptions'}
          </p>
        </div>
      </div>

      {/* Tip */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
        <p className="text-xs text-muted-foreground">
          💡 {isArabic 
            ? 'كلما زاد وقت تركيزك داخل المنصة، كلما تم تسجيل تقدمك بشكل أفضل. شاهد من داخل الموقع دائماً!'
            : 'The more you focus inside the platform, the better your progress is tracked. Always watch from inside the website!'}
        </p>
      </div>
    </div>
  );
};
