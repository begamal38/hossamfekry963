import React from 'react';
import { TrendingUp, TrendingDown, Minus, Award, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PerformanceChartProps {
  examScores: { score: number; maxScore: number; title: string }[];
  lessonsCompleted: number;
  totalLessons: number;
  compact?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  examScores,
  lessonsCompleted,
  totalLessons,
  compact = false
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Calculate average exam score
  const avgExamScore = examScores.length > 0
    ? Math.round(examScores.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / examScores.length)
    : 0;

  // Calculate progress percentage
  const progressPercent = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

  // Overall performance based on exams and lessons only
  const hasExams = examScores.length > 0;
  const overallScore = hasExams 
    ? Math.round((avgExamScore + progressPercent) / 2)
    : progressPercent;

  // Determine performance status
  const getPerformanceStatus = () => {
    if (overallScore >= 70) return { 
      label: isArabic ? 'أداء ممتاز 🎉' : 'Doing Great 🎉',
      color: 'text-green-600',
      bg: 'bg-green-50 dark:bg-green-950/30',
      icon: TrendingUp
    };
    if (overallScore >= 50) return {
      label: isArabic ? 'أداء جيد 👍' : 'Good Progress 👍',
      color: 'text-amber-600',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      icon: Minus
    };
    return {
      label: isArabic ? 'محتاج تركيز 💪' : 'Needs Focus 💪',
      color: 'text-red-600',
      bg: 'bg-red-50 dark:bg-red-950/30',
      icon: TrendingDown
    };
  };

  const status = getPerformanceStatus();
  const StatusIcon = status.icon;

  const metrics = [
    {
      label: isArabic ? 'الامتحانات' : 'Exams',
      value: avgExamScore,
      icon: Award,
      color: avgExamScore >= 70 ? 'text-green-600' : avgExamScore >= 50 ? 'text-amber-600' : 'text-red-600',
      bgColor: avgExamScore >= 70 ? 'bg-green-100 dark:bg-green-900/40' : avgExamScore >= 50 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-red-100 dark:bg-red-900/40',
      hasData: examScores.length > 0
    },
    {
      label: isArabic ? 'الحصص' : 'Lessons',
      value: progressPercent,
      icon: BookOpen,
      color: progressPercent >= 70 ? 'text-green-600' : progressPercent >= 50 ? 'text-amber-600' : 'text-blue-600',
      bgColor: progressPercent >= 70 ? 'bg-green-100 dark:bg-green-900/40' : progressPercent >= 50 ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-blue-100 dark:bg-blue-900/40',
      hasData: totalLessons > 0
    }
  ];

  // Compact version for mobile
  if (compact) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">
            {isArabic ? 'تحليل الأداء' : 'Performance'}
          </h3>
          <div className={cn("flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", status.bg, status.color)}>
            <StatusIcon className="w-3 h-3" />
            <span>{status.label}</span>
          </div>
        </div>

        {/* Two metrics side by side */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {metrics.map((metric, idx) => (
            <div key={idx} className="text-center">
              <div className={cn("w-10 h-10 rounded-full mx-auto mb-1.5 flex items-center justify-center", metric.bgColor)}>
                <metric.icon className={cn("w-4 h-4", metric.color)} />
              </div>
              <div className={cn("text-xl font-bold", metric.hasData ? metric.color : 'text-muted-foreground')}>
                {metric.hasData ? `${metric.value}%` : '-'}
              </div>
              <p className="text-[10px] text-muted-foreground">{metric.label}</p>
            </div>
          ))}
        </div>

        {/* Progress bars */}
        <div className="space-y-2">
          {metrics.map((metric, idx) => (
            <div key={idx}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-muted-foreground">{metric.label}</span>
                <span className={cn("font-medium", metric.hasData ? metric.color : 'text-muted-foreground')}>
                  {metric.hasData ? `${metric.value}%` : '-'}
                </span>
              </div>
              <Progress value={metric.hasData ? metric.value : 0} className="h-1.5" />
            </div>
          ))}
        </div>

        {/* Recent Exams - Compact */}
        {examScores.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <h4 className="text-xs font-medium text-foreground mb-2">
              {isArabic ? 'آخر الامتحانات' : 'Recent Exams'}
            </h4>
            <div className="space-y-1">
              {examScores.slice(0, 2).map((exam, idx) => {
                const percent = Math.round((exam.score / exam.maxScore) * 100);
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate flex-1">{exam.title}</span>
                    <span className={cn(
                      "font-medium ms-2",
                      percent >= 70 ? "text-green-600" : percent >= 50 ? "text-amber-600" : "text-red-600"
                    )}>
                      {exam.score}/{exam.maxScore}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>
    );
  }

  // Full version for desktop
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          {isArabic ? 'تحليل الأداء' : 'Performance Analysis'}
        </h3>
        <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium", status.bg, status.color)}>
          <StatusIcon className="w-4 h-4" />
          <span>{status.label}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="text-center">
            <div className={cn("w-14 h-14 rounded-full mx-auto mb-2 flex items-center justify-center", metric.bgColor)}>
              <metric.icon className={cn("w-6 h-6", metric.color)} />
            </div>
            <div className={cn("text-3xl font-bold mb-1", metric.hasData ? metric.color : 'text-muted-foreground')}>
              {metric.hasData ? `${metric.value}%` : '-'}
            </div>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Visual Bars */}
      <div className="space-y-4">
        {metrics.map((metric, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className={cn("font-medium", metric.hasData ? metric.color : 'text-muted-foreground')}>
                {metric.hasData ? `${metric.value}%` : '-'}
              </span>
            </div>
            <Progress value={metric.hasData ? metric.value : 0} className="h-2" />
          </div>
        ))}
      </div>

      {/* Recent Exams */}
      {examScores.length > 0 && (
        <div className="mt-6 pt-6 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">
            {isArabic ? 'آخر الامتحانات' : 'Recent Exams'}
          </h4>
          <div className="space-y-2">
            {examScores.slice(0, 3).map((exam, idx) => {
              const percent = Math.round((exam.score / exam.maxScore) * 100);
              return (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate flex-1">{exam.title}</span>
                  <span className={cn(
                    "font-medium ms-2",
                    percent >= 70 ? "text-green-600" : percent >= 50 ? "text-amber-600" : "text-red-600"
                  )}>
                    {exam.score}/{exam.maxScore}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
