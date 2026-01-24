import React from 'react';
import { BookOpen, Award, Video, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface StudentProgressOverviewProps {
  completedLessons: number;
  totalLessons: number;
  examsTaken: number;
  totalAttendance: number;
  isArabic: boolean;
}

export const StudentProgressOverview: React.FC<StudentProgressOverviewProps> = ({
  completedLessons,
  totalLessons,
  examsTaken,
  totalAttendance,
  isArabic,
}) => {
  const remainingLessons = Math.max(0, totalLessons - completedLessons);
  const progressPercent = totalLessons > 0 
    ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) 
    : 0;

  const getProgressColor = (percent: number) => {
    if (percent >= 70) return 'text-green-600';
    if (percent >= 40) return 'text-amber-600';
    return 'text-red-500';
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        {isArabic ? 'ملخص التقدم' : 'Progress Overview'}
      </h3>

      {/* Overall Progress Bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">
            {isArabic ? 'التقدم الإجمالي' : 'Overall Progress'}
          </span>
          <span className={`font-bold ${getProgressColor(progressPercent)}`}>
            {progressPercent}%
          </span>
        </div>
        <Progress 
          value={progressPercent} 
          className={`h-3 ${
            progressPercent >= 70 ? '[&>div]:bg-green-500' : 
            progressPercent >= 40 ? '[&>div]:bg-amber-500' : 
            '[&>div]:bg-red-500'
          }`}
        />
        <p className="text-xs text-muted-foreground mt-1.5">
          {isArabic 
            ? `${completedLessons} من ${totalLessons} درس مكتمل`
            : `${completedLessons} of ${totalLessons} lessons completed`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Completed Lessons */}
        <div className="bg-green-500/10 rounded-lg p-3 text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-green-500/20 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-green-600" />
          </div>
          <p className="text-xl font-bold text-green-600">{completedLessons}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {isArabic ? 'دروس مكتملة' : 'Completed'}
          </p>
        </div>

        {/* Remaining Lessons */}
        <div className="bg-blue-500/10 rounded-lg p-3 text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-blue-500/20 flex items-center justify-center">
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-xl font-bold text-blue-600">{remainingLessons}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {isArabic ? 'دروس متبقية' : 'Remaining'}
          </p>
        </div>

        {/* Exams Taken */}
        <div className="bg-purple-500/10 rounded-lg p-3 text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Award className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-xl font-bold text-purple-600">{examsTaken}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {isArabic ? 'امتحانات' : 'Exams'}
          </p>
        </div>

        {/* Attendance */}
        <div className="bg-amber-500/10 rounded-lg p-3 text-center">
          <div className="w-8 h-8 mx-auto mb-1.5 rounded-full bg-amber-500/20 flex items-center justify-center">
            <Video className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-600">{totalAttendance}</p>
          <p className="text-[11px] text-muted-foreground leading-tight">
            {isArabic ? 'حضور' : 'Attendance'}
          </p>
        </div>
      </div>
    </div>
  );
};
