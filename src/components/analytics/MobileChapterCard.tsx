import React from 'react';
import { BookOpen, Clock, Users, Eye, AlertTriangle, TrendingDown, TrendingUp, Award } from 'lucide-react';
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
  totalActiveMinutes?: number;
  studentsWithFocus?: number;
  avgViewingMinutes?: number;
  expectedDuration?: number;
  viewingCoverage?: number;
  totalInterruptions?: number;
}

interface MobileChapterCardProps {
  chapter: ChapterStat;
  isArabic: boolean;
}

/**
 * Mobile-optimized chapter card
 * Compact, touch-friendly, one chapter per row
 */
export const MobileChapterCard: React.FC<MobileChapterCardProps> = ({ chapter, isArabic }) => {
  const hasFocusData = (chapter.studentsWithFocus || 0) > 0;
  const viewingCoverage = chapter.viewingCoverage || 0;
  const isWeak = viewingCoverage < 30;
  const isStrong = viewingCoverage >= 70;
  const hasExam = chapter.examPassRate !== null;

  return (
    <div className="bg-card border rounded-lg p-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-medium truncate">
            {isArabic ? chapter.titleAr : chapter.title}
          </h4>
          <p className="text-xs text-muted-foreground truncate">
            {isArabic ? chapter.courseNameAr : chapter.courseName}
          </p>
        </div>
        {hasFocusData && (
          <Badge 
            variant={isWeak ? "destructive" : isStrong ? "default" : "secondary"}
            className={cn(
              "text-xs shrink-0",
              isStrong && "bg-green-600"
            )}
          >
            {viewingCoverage}%
          </Badge>
        )}
      </div>

      {/* Viewing Coverage Bar */}
      {hasFocusData && (
        <div className="mb-2">
          <Progress 
            value={viewingCoverage} 
            className={cn(
              "h-1.5",
              isWeak && "[&>div]:bg-red-500",
              isStrong && "[&>div]:bg-green-500"
            )}
          />
        </div>
      )}

      {/* Compact Stats Row */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {chapter.studentsWithFocus || 0}/{chapter.totalStudents}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {chapter.avgViewingMinutes || 0}{isArabic ? 'د' : 'm'}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="h-3 w-3" />
          {chapter.totalLessons}
        </span>
        {hasExam && (
          <span className={cn(
            "flex items-center gap-1",
            chapter.examPassRate! >= 60 ? "text-green-600" : "text-amber-600"
          )}>
            <Award className="h-3 w-3" />
            {chapter.examPassRate}%
          </span>
        )}
      </div>

      {/* Warning indicator if weak */}
      {hasFocusData && isWeak && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-dashed">
          <TrendingDown className="h-3 w-3 text-red-500" />
          <span className="text-xs text-red-600">
            {isArabic ? 'يحتاج تدخل' : 'Needs attention'}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * Mobile Chapter Analytics List
 */
interface MobileChapterAnalyticsProps {
  chapters: ChapterStat[];
  isArabic: boolean;
}

export const MobileChapterAnalytics: React.FC<MobileChapterAnalyticsProps> = ({ chapters, isArabic }) => {
  if (chapters.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          {isArabic ? 'تحليل الأبواب' : 'Chapter Analytics'}
        </h3>
        <p className="text-sm text-muted-foreground text-center py-3">
          {isArabic ? 'لا توجد بيانات' : 'No data available'}
        </p>
      </div>
    );
  }

  // Sort by viewing coverage (lowest first)
  const sortedChapters = [...chapters].sort((a, b) => 
    (a.viewingCoverage || 0) - (b.viewingCoverage || 0)
  );

  const weakCount = chapters.filter(c => (c.viewingCoverage || 0) < 30).length;

  return (
    <div className="bg-card border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          {isArabic ? 'تحليل الأبواب' : 'Chapter Analytics'}
        </h3>
        <div className="flex gap-1.5">
          <Badge variant="secondary" className="text-xs">
            {chapters.length}
          </Badge>
          {weakCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {weakCount} {isArabic ? 'ضعيف' : 'weak'}
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {sortedChapters.slice(0, 5).map((chapter) => (
          <MobileChapterCard 
            key={chapter.id} 
            chapter={chapter} 
            isArabic={isArabic} 
          />
        ))}
      </div>

      {chapters.length > 5 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          {isArabic 
            ? `+ ${chapters.length - 5} باب آخر`
            : `+ ${chapters.length - 5} more chapters`
          }
        </p>
      )}
    </div>
  );
};

export default MobileChapterCard;
