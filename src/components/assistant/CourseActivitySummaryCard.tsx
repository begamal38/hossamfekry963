import React from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Gauge, 
  BookOpen, 
  CalendarCheck, 
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Layers
} from 'lucide-react';
import { CourseActivitySummary } from '@/hooks/useCourseActivitySummary';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface CourseActivitySummaryCardProps {
  summary: CourseActivitySummary;
  className?: string;
}

export const CourseActivitySummaryCard: React.FC<CourseActivitySummaryCardProps> = ({
  summary,
  className,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';

  const scoreLabels = {
    low: isArabic ? 'منخفض' : 'Low',
    medium: isArabic ? 'متوسط' : 'Medium',
    high: isArabic ? 'مرتفع' : 'High',
  };

  const coverageLabels = {
    weak: isArabic ? 'ضعيف' : 'Weak',
    fair: isArabic ? 'مقبول' : 'Fair',
    strong: isArabic ? 'قوي' : 'Strong',
  };

  const getScoreColor = (score: 'low' | 'medium' | 'high') => {
    switch (score) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-amber-600 bg-amber-100';
      case 'low': return 'text-red-600 bg-red-100';
    }
  };

  const getCoverageColor = (label: 'weak' | 'fair' | 'strong') => {
    switch (label) {
      case 'strong': return 'text-green-600 bg-green-100';
      case 'fair': return 'text-amber-600 bg-amber-100';
      case 'weak': return 'text-red-600 bg-red-100';
    }
  };

  const getScoreIcon = (score: 'low' | 'medium' | 'high') => {
    switch (score) {
      case 'high': return <TrendingUp className="w-4 h-4" />;
      case 'medium': return <Minus className="w-4 h-4" />;
      case 'low': return <TrendingDown className="w-4 h-4" />;
    }
  };

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="bg-muted/30 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary" />
          {isArabic ? 'ملخص نشاط الطالب' : 'Student Activity Summary'}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {isArabic 
            ? `تم التجميد في ${new Date(summary.frozenAt).toLocaleDateString('ar-EG')}`
            : `Frozen on ${new Date(summary.frozenAt).toLocaleDateString()}`}
        </p>
      </CardHeader>

      <CardContent className="p-4 space-y-6">
        {/* Engagement Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {isArabic ? 'مستوى التفاعل' : 'Engagement Level'}
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
              getScoreColor(summary.engagementScore)
            )}>
              {getScoreIcon(summary.engagementScore)}
              {scoreLabels[summary.engagementScore]}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isArabic 
              ? `${summary.totalFocusSessions} جلسة تركيز • ${summary.totalActiveMinutes} دقيقة نشطة`
              : `${summary.totalFocusSessions} focus sessions • ${summary.totalActiveMinutes} active minutes`}
          </p>
        </div>

        {/* Coverage Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {isArabic ? 'تغطية المحتوى' : 'Content Coverage'}
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
              getCoverageColor(summary.coverageLabel)
            )}>
              {summary.coveragePercentage}%
              <span className="mx-1">•</span>
              {coverageLabels[summary.coverageLabel]}
            </div>
          </div>
          <Progress value={summary.coveragePercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {isArabic 
                ? `${summary.lessonsCompleted}/${summary.totalLessons} حصة مكتملة`
                : `${summary.lessonsCompleted}/${summary.totalLessons} lessons completed`}
            </span>
            <span>
              {isArabic 
                ? `${summary.chaptersAccessed}/${summary.totalChapters} باب`
                : `${summary.chaptersAccessed}/${summary.totalChapters} chapters`}
            </span>
          </div>
        </div>

        {/* Consistency Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">
                {isArabic ? 'الانتظام' : 'Consistency'}
              </span>
            </div>
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium",
              getScoreColor(summary.consistencyScore)
            )}>
              {getScoreIcon(summary.consistencyScore)}
              {scoreLabels[summary.consistencyScore]}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {isArabic 
              ? `${summary.learningDays} يوم تعلم`
              : `${summary.learningDays} learning days`}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {summary.lessonsAccessed}
            </div>
            <div className="text-xs text-muted-foreground">
              {isArabic ? 'حصة مفتوحة' : 'Accessed'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {summary.lessonsCompleted}
            </div>
            <div className="text-xs text-muted-foreground">
              {isArabic ? 'مكتملة' : 'Completed'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">
              {summary.totalActiveMinutes}
            </div>
            <div className="text-xs text-muted-foreground">
              {isArabic ? 'دقيقة' : 'Minutes'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
