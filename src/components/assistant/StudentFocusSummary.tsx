import React from 'react';
import { Eye, Clock, Zap, AlertTriangle, PlayCircle, Target } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FocusStats {
  totalSessions: number;
  totalActiveMinutes: number;
  totalPausedMinutes: number;
  completedSessions: number;
  avgSessionMinutes: number;
  lessonsWatched: number;
}

interface StudentFocusSummaryProps {
  stats: FocusStats;
  isArabic: boolean;
}

export const StudentFocusSummary: React.FC<StudentFocusSummaryProps> = ({
  stats,
  isArabic,
}) => {
  // Determine focus quality based on completion ratio
  const completionRatio = stats.totalSessions > 0 
    ? stats.completedSessions / stats.totalSessions 
    : 0;
  
  const focusQuality: 'excellent' | 'good' | 'needsWork' = 
    completionRatio >= 0.7 ? 'excellent' :
    completionRatio >= 0.4 ? 'good' : 'needsWork';

  const qualityConfig = {
    excellent: {
      ar: 'تركيز ممتاز',
      en: 'Excellent Focus',
      color: 'text-green-600 bg-green-500/10 border-green-500/30',
    },
    good: {
      ar: 'تركيز جيد',
      en: 'Good Focus',
      color: 'text-amber-600 bg-amber-500/10 border-amber-500/30',
    },
    needsWork: {
      ar: 'يحتاج تحسين',
      en: 'Needs Improvement',
      color: 'text-red-600 bg-red-500/10 border-red-500/30',
    },
  };

  // Format time nicely
  const formatTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return isArabic ? `${hours}س ${mins}د` : `${hours}h ${mins}m`;
    }
    return isArabic ? `${minutes} دقيقة` : `${minutes}m`;
  };

  if (stats.totalSessions === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-primary" />
          {isArabic ? 'إحصائيات التركيز' : 'Focus Analytics'}
        </h3>
        <div className="text-center py-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Eye className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            {isArabic ? 'لا توجد جلسات تركيز مسجلة بعد' : 'No focus sessions recorded yet'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-teal-500/5 rounded-xl border border-green-500/20 p-5 sm:p-6">
      {/* Header with Quality Badge */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Eye className="h-5 w-5 text-green-600" />
          {isArabic ? 'إحصائيات التركيز' : 'Focus Analytics'}
        </h3>
        <Badge 
          variant="outline" 
          className={cn("text-xs gap-1.5", qualityConfig[focusQuality].color)}
        >
          <Target className="w-3 h-3" />
          {isArabic ? qualityConfig[focusQuality].ar : qualityConfig[focusQuality].en}
        </Badge>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {/* Total Watch Time */}
        <div className="bg-background/60 rounded-lg p-3 text-center backdrop-blur-sm">
          <Clock className="w-4 h-4 mx-auto mb-1 text-green-600" />
          <p className="text-lg sm:text-xl font-bold text-green-600">
            {formatTime(stats.totalActiveMinutes)}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'وقت المشاهدة' : 'Watch Time'}
          </p>
        </div>

        {/* Focus Sessions */}
        <div className="bg-background/60 rounded-lg p-3 text-center backdrop-blur-sm">
          <PlayCircle className="w-4 h-4 mx-auto mb-1 text-blue-600" />
          <p className="text-lg sm:text-xl font-bold text-blue-600">
            {stats.totalSessions}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'جلسات' : 'Sessions'}
          </p>
        </div>

        {/* Lessons Watched */}
        <div className="bg-background/60 rounded-lg p-3 text-center backdrop-blur-sm">
          <Zap className="w-4 h-4 mx-auto mb-1 text-amber-600" />
          <p className="text-lg sm:text-xl font-bold text-amber-600">
            {stats.lessonsWatched}
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'حصص' : 'Lessons'}
          </p>
        </div>

        {/* Avg Session */}
        <div className="bg-background/60 rounded-lg p-3 text-center backdrop-blur-sm">
          <Target className="w-4 h-4 mx-auto mb-1 text-purple-600" />
          <p className="text-lg sm:text-xl font-bold text-purple-600">
            {stats.avgSessionMinutes}
            <span className="text-xs font-normal mr-0.5">{isArabic ? 'د' : 'm'}</span>
          </p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            {isArabic ? 'متوسط/جلسة' : 'Avg/Session'}
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="flex items-center justify-between text-sm bg-background/40 rounded-lg px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {isArabic ? 'جلسات مكتملة:' : 'Completed:'}
          </span>
          <span className="font-semibold text-green-600">{stats.completedSessions}</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn(
            "w-3.5 h-3.5",
            stats.totalPausedMinutes > 30 ? "text-red-500" : "text-muted-foreground"
          )} />
          <span className="text-muted-foreground">
            {isArabic ? 'وقت التوقف:' : 'Paused:'}
          </span>
          <span className="font-medium">{formatTime(stats.totalPausedMinutes)}</span>
        </div>
      </div>
    </div>
  );
};
