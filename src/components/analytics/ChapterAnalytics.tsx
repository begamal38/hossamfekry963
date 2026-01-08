import React from 'react';
import { BookOpen, TrendingUp, TrendingDown, Users, Award, Clock, Eye, AlertTriangle } from 'lucide-react';
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
  // Focus-based metrics
  totalActiveMinutes?: number;
  studentsWithFocus?: number;
  avgViewingMinutes?: number;
  expectedDuration?: number;
  viewingCoverage?: number;
  totalInterruptions?: number;
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

  // Sort by lowest viewing coverage first to highlight problem areas
  const sortedChapters = [...chapters].sort((a, b) => 
    (a.viewingCoverage || 0) - (b.viewingCoverage || 0)
  );

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        {isArabic ? 'تحليل الأبواب (بيانات التركيز الفعلي)' : 'Chapter Analytics (Real Focus Data)'}
        <Badge variant="secondary" className="text-xs">{chapters.length}</Badge>
      </h3>

      <div className="space-y-4">
        {sortedChapters.slice(0, 8).map((chapter) => {
          const hasFocusData = (chapter.studentsWithFocus || 0) > 0;
          const viewingCoverage = chapter.viewingCoverage || 0;
          const isWeak = viewingCoverage < 30;
          const isStrong = viewingCoverage >= 70;
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
                  {hasFocusData && isWeak && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {isArabic ? 'مشاهدة ضعيفة' : 'Low Viewing'}
                    </Badge>
                  )}
                  {hasFocusData && isStrong && (
                    <Badge className="bg-green-600 text-xs gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {isArabic ? 'مشاهدة ممتازة' : 'Great Viewing'}
                    </Badge>
                  )}
                  {!hasFocusData && (
                    <Badge variant="outline" className="text-xs gap-1 text-muted-foreground">
                      {isArabic ? 'لا بيانات تركيز' : 'No focus data'}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Real Viewing Coverage Progress Bar */}
              {hasFocusData && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {isArabic ? 'تغطية المشاهدة الفعلية' : 'Actual Viewing Coverage'}
                    </span>
                    <span className={cn(
                      "font-medium",
                      isWeak && "text-red-600",
                      isStrong && "text-green-600",
                      !isWeak && !isStrong && "text-foreground"
                    )}>
                      {viewingCoverage}%
                    </span>
                  </div>
                  <Progress 
                    value={viewingCoverage} 
                    className={cn(
                      "h-2",
                      isWeak && "[&>div]:bg-red-500",
                      isStrong && "[&>div]:bg-green-500"
                    )}
                  />
                </div>
              )}

              {/* Completion Progress (secondary) */}
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">
                    {isArabic ? 'إكمال الحصص (تسجيل)' : 'Lesson Completion (logged)'}
                  </span>
                  <span className="text-muted-foreground">
                    {chapter.avgCompletion}%
                  </span>
                </div>
                <Progress 
                  value={chapter.avgCompletion} 
                  className="h-1.5 [&>div]:bg-muted-foreground/40"
                />
              </div>

              {/* Stats Row - Focus Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    {isArabic ? 'إجمالي التركيز' : 'Total Focus'}
                  </div>
                  <span className="font-semibold text-primary">
                    {chapter.totalActiveMinutes || 0} {isArabic ? 'د' : 'm'}
                  </span>
                </div>
                
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Users className="h-3 w-3" />
                    {isArabic ? 'شاهدوا فعلياً' : 'Actually Watched'}
                  </div>
                  <span className="font-semibold">
                    {chapter.studentsWithFocus || 0}/{chapter.totalStudents}
                  </span>
                </div>
                
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <Eye className="h-3 w-3" />
                    {isArabic ? 'متوسط/طالب' : 'Avg/Student'}
                  </div>
                  <span className="font-semibold">
                    {chapter.avgViewingMinutes || 0} {isArabic ? 'د' : 'm'}
                  </span>
                </div>
                
                <div className="bg-muted/50 rounded-md p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                    <AlertTriangle className="h-3 w-3" />
                    {isArabic ? 'انقطاعات' : 'Interrupts'}
                  </div>
                  <span className={cn(
                    "font-semibold",
                    (chapter.totalInterruptions || 0) > 10 && "text-amber-600"
                  )}>
                    {chapter.totalInterruptions || 0}
                  </span>
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {chapter.totalLessons} {isArabic ? 'حصة' : 'lessons'}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {chapter.expectedDuration || 0} {isArabic ? 'د متوقعة' : 'm expected'}
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
