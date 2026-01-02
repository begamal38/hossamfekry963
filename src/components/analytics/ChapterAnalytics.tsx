import React from 'react';
import { BookOpen, TrendingUp, TrendingDown, Users, Award } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChapterStat {
  id: string;
  title: string;
  titleAr: string;
  courseName: string;
  courseNameAr: string;
  totalLessons: number;
  avgCompletion: number;
  totalStudents: number;
  examPassRate: number | null;
}

interface ChapterAnalyticsProps {
  chapters: ChapterStat[];
  isArabic: boolean;
}

export const ChapterAnalytics: React.FC<ChapterAnalyticsProps> = ({ chapters, isArabic }) => {
  if (chapters.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          {isArabic ? 'تحليل الأبواب' : 'Chapter Analytics'}
        </h3>
        <p className="text-muted-foreground text-center py-4">
          {isArabic ? 'لا توجد بيانات أبواب' : 'No chapter data available'}
        </p>
      </div>
    );
  }

  // Sort by lowest completion first to highlight problem areas
  const sortedChapters = [...chapters].sort((a, b) => a.avgCompletion - b.avgCompletion);

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        {isArabic ? 'تحليل الأبواب' : 'Chapter Analytics'}
        <Badge variant="secondary" className="text-xs">{chapters.length}</Badge>
      </h3>

      <div className="space-y-4">
        {sortedChapters.slice(0, 8).map((chapter) => {
          const isWeak = chapter.avgCompletion < 30;
          const isStrong = chapter.avgCompletion >= 70;
          const hasExam = chapter.examPassRate !== null;

          return (
            <div key={chapter.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium truncate">
                    {isArabic ? chapter.titleAr : chapter.title}
                  </h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {isArabic ? chapter.courseNameAr : chapter.courseName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isWeak && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {isArabic ? 'ضعيف' : 'Weak'}
                    </Badge>
                  )}
                  {isStrong && (
                    <Badge className="bg-green-600 text-xs gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {isArabic ? 'ممتاز' : 'Strong'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {isArabic ? 'متوسط الإكمال' : 'Avg Completion'}
                  </span>
                  <span className={cn(
                    "font-medium",
                    isWeak && "text-red-600",
                    isStrong && "text-green-600",
                    !isWeak && !isStrong && "text-foreground"
                  )}>
                    {chapter.avgCompletion}%
                  </span>
                </div>
                <Progress 
                  value={chapter.avgCompletion} 
                  className={cn(
                    "h-2",
                    isWeak && "[&>div]:bg-red-500",
                    isStrong && "[&>div]:bg-green-500"
                  )}
                />
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {chapter.totalLessons} {isArabic ? 'حصة' : 'lessons'}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {chapter.totalStudents} {isArabic ? 'طالب' : 'students'}
                </span>
                {hasExam && (
                  <span className={cn(
                    "flex items-center gap-1",
                    chapter.examPassRate! >= 60 ? "text-green-600" : "text-amber-600"
                  )}>
                    <Award className="h-3 w-3" />
                    {chapter.examPassRate}% {isArabic ? 'نجاح' : 'pass'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {chapters.length > 8 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {isArabic 
            ? `+ ${chapters.length - 8} باب آخر`
            : `+ ${chapters.length - 8} more chapters`
          }
        </p>
      )}
    </div>
  );
};
