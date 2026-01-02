import React from 'react';
import { User, TrendingUp, BookOpen, Award, Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StudentPerformanceData {
  userId: string;
  fullName: string | null;
  email: string | null;
  attendanceScore: number; // Based on lesson completions
  learningConsistency: number; // Days active per week
  examAverage: number;
  totalLessonsCompleted: number;
  totalLessonsAvailable: number;
  totalExamsTaken: number;
  examsPassed: number;
  examsFailed: number;
  weakChapters: { id: string; title: string; progress: number }[];
  strongChapters: { id: string; title: string; progress: number }[];
  lastActiveAt: string | null;
}

interface StudentPerformanceProfileProps {
  data: StudentPerformanceData;
  isArabic: boolean;
}

export const StudentPerformanceProfile: React.FC<StudentPerformanceProfileProps> = ({ data, isArabic }) => {
  const overallProgress = data.totalLessonsAvailable > 0 
    ? Math.round((data.totalLessonsCompleted / data.totalLessonsAvailable) * 100)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-blue-500';
    if (progress >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-card border rounded-xl p-6">
      <div className="flex items-center gap-4 mb-6 pb-4 border-b">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold truncate">
            {data.fullName || (isArabic ? 'طالب' : 'Student')}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{data.email}</p>
        </div>
        <Badge className={cn(
          "shrink-0",
          overallProgress >= 70 ? "bg-green-600" : overallProgress >= 40 ? "bg-amber-600" : "bg-muted text-muted-foreground"
        )}>
          {overallProgress}% {isArabic ? 'تقدم' : 'Progress'}
        </Badge>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <BookOpen className="h-4 w-4" />
          </div>
          <p className={cn("text-2xl font-bold", getScoreColor(data.attendanceScore))}>
            {data.attendanceScore}%
          </p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'نسبة الحضور' : 'Attendance'}</p>
        </div>

        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Calendar className="h-4 w-4" />
          </div>
          <p className={cn("text-2xl font-bold", getScoreColor(data.learningConsistency * 14))}>
            {data.learningConsistency}/7
          </p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'أيام نشط/أسبوع' : 'Days Active/Week'}</p>
        </div>

        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Award className="h-4 w-4" />
          </div>
          <p className={cn("text-2xl font-bold", getScoreColor(data.examAverage))}>
            {data.examAverage}%
          </p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'متوسط الامتحانات' : 'Exam Average'}</p>
        </div>

        <div className="text-center p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold">
            {data.totalLessonsCompleted}/{data.totalLessonsAvailable}
          </p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'الحصص' : 'Lessons'}</p>
        </div>
      </div>

      {/* Exam Performance */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          {isArabic ? 'أداء الامتحانات' : 'Exam Performance'}
        </h4>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-lg font-bold text-green-600">{data.examsPassed}</span>
            <span className="text-sm text-muted-foreground">{isArabic ? 'نجاح' : 'passed'}</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-lg font-bold text-red-600">{data.examsFailed}</span>
            <span className="text-sm text-muted-foreground">{isArabic ? 'رسوب' : 'failed'}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            ({data.totalExamsTaken} {isArabic ? 'إجمالي' : 'total'})
          </div>
        </div>
      </div>

      {/* Weak Chapters */}
      {data.weakChapters.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 text-amber-600 flex items-center gap-2">
            ⚠️ {isArabic ? 'أبواب تحتاج اهتمام' : 'Chapters Needing Attention'}
          </h4>
          <div className="space-y-2">
            {data.weakChapters.slice(0, 3).map(chapter => (
              <div key={chapter.id} className="flex items-center gap-3">
                <span className="text-sm flex-1 truncate">{chapter.title}</span>
                <Progress value={chapter.progress} className="w-20 h-1.5 [&>div]:bg-amber-500" />
                <span className="text-xs text-muted-foreground w-10">{chapter.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strong Chapters */}
      {data.strongChapters.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-green-600 flex items-center gap-2">
            ✅ {isArabic ? 'أبواب ممتازة' : 'Strong Chapters'}
          </h4>
          <div className="space-y-2">
            {data.strongChapters.slice(0, 3).map(chapter => (
              <div key={chapter.id} className="flex items-center gap-3">
                <span className="text-sm flex-1 truncate">{chapter.title}</span>
                <Progress value={chapter.progress} className="w-20 h-1.5 [&>div]:bg-green-500" />
                <span className="text-xs text-muted-foreground w-10">{chapter.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Active */}
      {data.lastActiveAt && (
        <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {isArabic ? 'آخر نشاط:' : 'Last active:'} {new Date(data.lastActiveAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
};
