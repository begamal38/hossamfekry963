import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Play, CheckCircle2, Trophy, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ChapterExamSectionProps {
  chapterId: string;
  isArabic: boolean;
  // Chapter progress data (passed from parent to avoid duplicate fetches)
  exam?: {
    id: string;
    title: string;
    title_ar: string;
  } | null;
  chapterProgress?: {
    totalLessons: number;
    completedLessons: number;
    isComplete: boolean;
    progressPercent: number;
  } | null;
  examAttempt?: {
    score: number;
    total_questions: number;
  } | null;
  canAccessExam: boolean;
}

export const ChapterExamSection: React.FC<ChapterExamSectionProps> = ({
  chapterId,
  isArabic,
  exam,
  chapterProgress,
  examAttempt,
  canAccessExam,
}) => {
  const navigate = useNavigate();

  // No exam for this chapter
  if (!exam) {
    return null;
  }

  const hasCompleted = !!examAttempt;
  const percentage = examAttempt 
    ? Math.round((examAttempt.score / examAttempt.total_questions) * 100) 
    : 0;
  const passed = percentage >= 60;
  const isLocked = !canAccessExam && !hasCompleted;

  // Calculate remaining lessons
  const remainingLessons = chapterProgress 
    ? chapterProgress.totalLessons - chapterProgress.completedLessons 
    : 0;

  return (
    <Card className={cn(
      "border-2 transition-all",
      hasCompleted 
        ? passed ? "border-green-500/30 bg-green-500/5" : "border-amber-500/30 bg-amber-500/5"
        : isLocked
        ? "border-muted bg-muted/20"
        : "border-primary/30 bg-primary/5"
    )}>
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              hasCompleted 
                ? passed ? "bg-green-500/10" : "bg-amber-500/10"
                : isLocked
                ? "bg-muted"
                : "bg-primary/10"
            )}>
              {hasCompleted ? (
                passed ? <Trophy className="w-6 h-6 text-green-500" /> : <FileText className="w-6 h-6 text-amber-500" />
              ) : isLocked ? (
                <Lock className="w-6 h-6 text-muted-foreground" />
              ) : (
                <FileText className="w-6 h-6 text-primary" />
              )}
            </div>
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                {isArabic ? 'امتحان الباب' : 'Chapter Exam'}
                {hasCompleted && (
                  <Badge className={passed ? "bg-green-500" : "bg-amber-500"}>
                    {examAttempt?.score}/{examAttempt?.total_questions}
                  </Badge>
                )}
              </h4>
              <p className="text-sm text-muted-foreground">
                {isArabic ? exam.title_ar : exam.title}
                {hasCompleted && ` • ${percentage}%`}
              </p>
            </div>
          </div>

          {/* Exam Button - State driven by chapter completion */}
          {hasCompleted ? (
            <Button
              onClick={() => navigate(`/exam/${exam.id}`)}
              variant="outline"
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isArabic ? 'تم حل الامتحان ✓' : 'Exam Completed ✓'}
            </Button>
          ) : isLocked ? (
            <Button
              disabled
              variant="outline"
              className="gap-2 opacity-60 cursor-not-allowed"
            >
              <Lock className="w-4 h-4" />
              {isArabic ? 'مقفول' : 'Locked'}
            </Button>
          ) : (
            <Button
              onClick={() => navigate(`/exam/${exam.id}`)}
              className="gap-2"
            >
              <Play className="w-4 h-4" />
              {isArabic ? 'ابدأ امتحان الباب' : 'Start Chapter Exam'}
            </Button>
          )}
        </div>

        {/* Progress indicator when locked */}
        {isLocked && chapterProgress && (
          <div className="mt-4 pt-4 border-t border-muted">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                {isArabic ? 'تقدم الباب' : 'Chapter Progress'}
              </span>
              <span className="font-medium">
                {chapterProgress.completedLessons}/{chapterProgress.totalLessons}
              </span>
            </div>
            <Progress value={chapterProgress.progressPercent} className="h-2 mb-2" />
            <p className="text-sm text-muted-foreground">
              {isArabic 
                ? `كمّل ${remainingLessons} ${remainingLessons === 1 ? 'حصة' : 'حصص'} علشان يفتح الامتحان`
                : `Complete ${remainingLessons} more ${remainingLessons === 1 ? 'lesson' : 'lessons'} to unlock the exam`
              }
            </p>
          </div>
        )}

        {/* Guidance for available exam */}
        {!hasCompleted && !isLocked && (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t">
            {isArabic 
              ? 'خلصت كل حصص الباب ✅ — ابدأ الامتحان دلوقتي'
              : 'All chapter lessons completed ✅ — Start the exam now'
            }
          </p>
        )}
      </CardContent>
    </Card>
  );
};
