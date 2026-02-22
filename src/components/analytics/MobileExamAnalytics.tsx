import React from 'react';
import { Award, Users, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ExamStat {
  id: string;
  title: string;
  titleAr: string;
  courseName: string;
  courseNameAr: string;
  totalAttempts: number;
  passCount: number;
  failCount: number;
  avgScore: number;
  firstAttemptPassRate: number;
}

interface MobileExamAnalyticsProps {
  exams: ExamStat[];
  isArabic: boolean;
}

const getStatusBadge = (passRate: number, isArabic: boolean) => {
  if (passRate >= 80) return { label: isArabic ? 'ممتاز' : 'Excellent', variant: 'success' as const };
  if (passRate >= 50) return { label: isArabic ? 'متوسط' : 'Average', variant: 'warning' as const };
  return { label: isArabic ? 'يحتاج مراجعة' : 'Needs Review', variant: 'destructive' as const };
};

export const MobileExamAnalytics: React.FC<MobileExamAnalyticsProps> = ({ exams, isArabic }) => {
  if (exams.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-4">
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          {isArabic ? 'تحليل الامتحانات' : 'Exam Analytics'}
        </h3>
        <p className="text-sm text-muted-foreground text-center py-3">
          {isArabic ? 'لا توجد بيانات امتحانات' : 'No exam data available'}
        </p>
      </div>
    );
  }

  const totalAttempts = exams.reduce((sum, e) => sum + e.totalAttempts, 0);
  const totalPassed = exams.reduce((sum, e) => sum + e.passCount, 0);
  const totalFailed = exams.reduce((sum, e) => sum + e.failCount, 0);
  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

  const sortedExams = [...exams]
    .filter(e => e.totalAttempts > 0)
    .map(e => ({
      ...e,
      passRate: Math.round((e.passCount / e.totalAttempts) * 100)
    }))
    .sort((a, b) => a.passRate - b.passRate);

  const criticalExams = sortedExams.filter(e => e.passRate < 50);

  return (
    <div className="bg-card border rounded-xl p-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold flex items-center gap-2">
          <Award className="h-4 w-4 text-primary" />
          {isArabic ? 'تحليل الامتحانات' : 'Exam Analytics'}
        </h3>
        {criticalExams.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            {criticalExams.length} {isArabic ? 'يحتاج مراجعة' : 'need review'}
          </Badge>
        )}
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-muted/50 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold">{totalAttempts}</p>
          <p className="text-[11px] text-muted-foreground">{isArabic ? 'محاولة' : 'Attempts'}</p>
        </div>
        <div className="bg-green-500/10 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-green-600">{overallPassRate}%</p>
          <p className="text-[11px] text-muted-foreground">{isArabic ? 'نسبة النجاح' : 'Pass Rate'}</p>
        </div>
        <div className="bg-red-500/10 rounded-lg p-2.5 text-center">
          <p className="text-lg font-bold text-red-600">{totalFailed}</p>
          <p className="text-[11px] text-muted-foreground">{isArabic ? 'رسوب' : 'Failed'}</p>
        </div>
      </div>

      {/* Exam List */}
      <div className="space-y-3">
        {sortedExams.slice(0, 5).map((exam) => {
          const isCritical = exam.passRate < 50;
          const isGood = exam.passRate >= 70;
          const status = getStatusBadge(exam.passRate, isArabic);

          return (
            <div 
              key={exam.id} 
              className={cn(
                "rounded-xl border p-3",
                isCritical && "bg-red-500/5 border-red-500/20",
                isGood && "bg-green-500/5 border-green-500/20"
              )}
            >
              {/* Title + Status Badge */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {isArabic ? exam.titleAr : exam.title}
                  </p>
                  {(exam.courseName || exam.courseNameAr) && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {isArabic ? exam.courseNameAr : exam.courseName}
                    </p>
                  )}
                </div>
                <Badge variant={status.variant} className="text-[10px] shrink-0">
                  {status.label}
                </Badge>
              </div>
              
              {/* Pass/Fail bar with labels */}
              <div className="mb-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span className="text-green-600">{isArabic ? `نجاح ${exam.passRate}%` : `Pass ${exam.passRate}%`}</span>
                  <span className="text-red-600">{isArabic ? `رسوب ${100 - exam.passRate}%` : `Fail ${100 - exam.passRate}%`}</span>
                </div>
                <div className="flex h-1.5 rounded-full overflow-hidden bg-muted">
                  <div className="bg-green-500 transition-all" style={{ width: `${exam.passRate}%` }} />
                  <div className="bg-red-500 transition-all" style={{ width: `${100 - exam.passRate}%` }} />
                </div>
              </div>
              
              {/* Labeled stats row */}
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {exam.totalAttempts} {isArabic ? 'طالب' : 'students'}
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  {exam.passCount} {isArabic ? 'ناجح' : 'passed'}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  {exam.failCount} {isArabic ? 'راسب' : 'failed'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {sortedExams.length > 5 && (
        <p className="text-xs text-muted-foreground text-center mt-3">
          {isArabic 
            ? `+ ${sortedExams.length - 5} امتحان آخر`
            : `+ ${sortedExams.length - 5} more exams`
          }
        </p>
      )}
    </div>
  );
};

export default MobileExamAnalytics;
