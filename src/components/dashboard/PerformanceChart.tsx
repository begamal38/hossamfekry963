import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Award, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PerformanceChartProps {
  examScores: { score: number; maxScore: number; title: string }[];
  lessonsCompleted: number;
  totalLessons: number;
  attendanceRate: number;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({
  examScores,
  lessonsCompleted,
  totalLessons,
  attendanceRate
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  // Calculate average exam score
  const avgExamScore = examScores.length > 0
    ? Math.round(examScores.reduce((sum, e) => sum + (e.score / e.maxScore) * 100, 0) / examScores.length)
    : 0;

  // Calculate progress percentage
  const progressPercent = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0;

  // Determine performance status
  const getPerformanceStatus = () => {
    const overall = (avgExamScore + progressPercent + attendanceRate) / 3;
    if (overall >= 70) return { 
      label: isArabic ? 'أداء ممتاز 🎉' : 'Doing Great 🎉',
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: TrendingUp
    };
    if (overall >= 50) return {
      label: isArabic ? 'أداء جيد 👍' : 'Good Progress 👍',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: Minus
    };
    return {
      label: isArabic ? 'محتاج تركيز 💪' : 'Needs Focus 💪',
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: TrendingDown
    };
  };

  const status = getPerformanceStatus();
  const StatusIcon = status.icon;

  const metrics = [
    {
      label: isArabic ? 'متوسط الامتحانات' : 'Exam Average',
      value: avgExamScore,
      icon: Award,
      color: avgExamScore >= 70 ? 'text-green-600' : avgExamScore >= 50 ? 'text-amber-600' : 'text-red-600',
      bgColor: avgExamScore >= 70 ? 'bg-green-100' : avgExamScore >= 50 ? 'bg-amber-100' : 'bg-red-100'
    },
    {
      label: isArabic ? 'تقدم الحصص' : 'Lesson Progress',
      value: progressPercent,
      icon: BookOpen,
      color: progressPercent >= 70 ? 'text-green-600' : progressPercent >= 50 ? 'text-amber-600' : 'text-blue-600',
      bgColor: progressPercent >= 70 ? 'bg-green-100' : progressPercent >= 50 ? 'bg-amber-100' : 'bg-blue-100'
    },
    {
      label: isArabic ? 'نسبة الحضور' : 'Attendance Rate',
      value: attendanceRate,
      icon: Target,
      color: attendanceRate >= 70 ? 'text-green-600' : attendanceRate >= 50 ? 'text-amber-600' : 'text-red-600',
      bgColor: attendanceRate >= 70 ? 'bg-green-100' : attendanceRate >= 50 ? 'bg-amber-100' : 'bg-red-100'
    }
  ];

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
      <div className="grid grid-cols-3 gap-4 mb-6">
        {metrics.map((metric, idx) => (
          <div key={idx} className="text-center">
            <div className={cn("w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center", metric.bgColor)}>
              <metric.icon className={cn("w-5 h-5", metric.color)} />
            </div>
            <div className={cn("text-2xl font-bold mb-1", metric.color)}>
              {metric.value}%
            </div>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
          </div>
        ))}
      </div>

      {/* Visual Bars */}
      <div className="space-y-4">
        {metrics.map((metric, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{metric.label}</span>
              <span className={cn("font-medium", metric.color)}>{metric.value}%</span>
            </div>
            <Progress value={metric.value} className="h-2" />
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
