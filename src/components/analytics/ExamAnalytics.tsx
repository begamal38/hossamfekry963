import React from 'react';
import { Award, CheckCircle2, XCircle, Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

interface ExamAnalyticsProps {
  exams: ExamStat[];
  isArabic: boolean;
}

export const ExamAnalytics: React.FC<ExamAnalyticsProps> = ({ exams, isArabic }) => {
  if (exams.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          {isArabic ? 'تحليل الامتحانات' : 'Exam Analytics'}
        </h3>
        <p className="text-muted-foreground text-center py-4">
          {isArabic ? 'لا توجد بيانات امتحانات' : 'No exam data available'}
        </p>
      </div>
    );
  }

  // Calculate overall stats
  const totalAttempts = exams.reduce((sum, e) => sum + e.totalAttempts, 0);
  const totalPassed = exams.reduce((sum, e) => sum + e.passCount, 0);
  const totalFailed = exams.reduce((sum, e) => sum + e.failCount, 0);
  const overallPassRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 0;

  // Sort by pass rate to highlight problem exams
  const sortedExams = [...exams].sort((a, b) => {
    const aPassRate = a.totalAttempts > 0 ? (a.passCount / a.totalAttempts) * 100 : 0;
    const bPassRate = b.totalAttempts > 0 ? (b.passCount / b.totalAttempts) * 100 : 0;
    return aPassRate - bPassRate;
  });

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        {isArabic ? 'تحليل الامتحانات' : 'Exam Analytics'}
        <Badge variant="secondary" className="text-xs">{exams.length}</Badge>
      </h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 pb-4 border-b">
        <div className="text-center">
          <p className="text-2xl font-bold text-foreground">{totalAttempts}</p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'إجمالي المحاولات' : 'Total Attempts'}</p>
        </div>
        <div className="text-center">
          <p className={cn(
            "text-2xl font-bold",
            overallPassRate >= 60 ? "text-green-600" : "text-amber-600"
          )}>
            {overallPassRate}%
          </p>
          <p className="text-xs text-muted-foreground">{isArabic ? 'نسبة النجاح' : 'Pass Rate'}</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-600 font-bold">{totalPassed}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-red-600 font-bold">{totalFailed}</span>
          </div>
          <p className="text-xs text-muted-foreground">{isArabic ? 'نجاح / رسوب' : 'Pass / Fail'}</p>
        </div>
      </div>

      {/* Individual Exams */}
      <div className="space-y-4">
        {sortedExams.slice(0, 6).map((exam) => {
          const passRate = exam.totalAttempts > 0 
            ? Math.round((exam.passCount / exam.totalAttempts) * 100) 
            : 0;
          const isProblematic = passRate < 50 && exam.totalAttempts >= 3;
          const isStrong = passRate >= 80;

          return (
            <div 
              key={exam.id} 
              className={cn(
                "border rounded-lg p-4",
                isProblematic && "border-amber-500/50 bg-amber-500/5"
              )}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium truncate">
                      {isArabic ? exam.titleAr : exam.title}
                    </h4>
                    {isProblematic && (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {isArabic ? exam.courseNameAr : exam.courseName}
                  </p>
                </div>
                <Badge className={cn(
                  "shrink-0",
                  passRate >= 70 && "bg-green-600",
                  passRate >= 50 && passRate < 70 && "bg-amber-600",
                  passRate < 50 && "bg-red-600"
                )}>
                  {passRate}%
                </Badge>
              </div>

              {/* Pass/Fail Bar */}
              <div className="mb-3">
                <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                  <div 
                    className="bg-green-500 transition-all"
                    style={{ width: `${passRate}%` }}
                  />
                  <div 
                    className="bg-red-400 transition-all"
                    style={{ width: `${100 - passRate}%` }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {exam.totalAttempts} {isArabic ? 'محاولة' : 'attempts'}
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <CheckCircle2 className="h-3 w-3" />
                  {exam.passCount}
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3 w-3" />
                  {exam.failCount}
                </span>
                <span className="text-muted-foreground">
                  {isArabic ? 'متوسط' : 'Avg'}: {exam.avgScore}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {exams.length > 6 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {isArabic 
            ? `+ ${exams.length - 6} امتحان آخر`
            : `+ ${exams.length - 6} more exams`
          }
        </p>
      )}
    </div>
  );
};
