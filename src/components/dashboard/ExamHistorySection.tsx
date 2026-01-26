import React from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, XCircle, ChevronRight, ChevronLeft, Calendar, Target, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ExamResult {
  id: string;
  score: number;
  created_at: string;
  exam: {
    id: string;
    title: string;
    title_ar: string;
    max_score: number;
    pass_mark: number;
    course: {
      title: string;
      title_ar: string;
    };
  };
}

interface ExamHistorySectionProps {
  examResults: ExamResult[];
  isArabic: boolean;
  className?: string;
}

export const ExamHistorySection: React.FC<ExamHistorySectionProps> = ({
  examResults,
  isArabic,
  className
}) => {
  const ArrowIcon = isArabic ? ChevronLeft : ChevronRight;
  
  // Sort by most recent
  const sortedResults = [...examResults].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  if (examResults.length === 0) {
    return (
      <Card className={cn("p-6", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isArabic ? 'سجل الامتحانات' : 'Exam History'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'نتائجك السابقة' : 'Your past results'}
            </p>
          </div>
        </div>
        
        {/* Empty state - calm design */}
        <div className="text-center py-8">
          <div className="w-14 h-14 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
            <Award className="w-7 h-7 text-muted-foreground/60" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            {isArabic ? 'لا يوجد امتحانات بعد' : 'No exams yet'}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {isArabic ? 'سيتم إشعارك فور نشر امتحان جديد' : 'You\'ll be notified when exams are available'}
          </p>
        </div>
      </Card>
    );
  }

  // Calculate overall stats
  const totalExams = examResults.length;
  const passedExams = examResults.filter(r => r.score >= (r.exam?.pass_mark || 0)).length;
  const avgScore = Math.round(examResults.reduce((sum, r) => sum + (r.score / (r.exam?.max_score || 100) * 100), 0) / totalExams);

  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Award className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {isArabic ? 'سجل الامتحانات' : 'Exam History'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isArabic ? `${totalExams} امتحان` : `${totalExams} exams`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-primary">
          <Link to="/exams" className="flex items-center gap-1">
            {isArabic ? 'الكل' : 'All'}
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-muted/50 rounded-xl">
        <div className="text-center">
          <div className="text-lg font-bold text-foreground">{totalExams}</div>
          <div className="text-[10px] text-muted-foreground">
            {isArabic ? 'امتحان' : 'Total'}
          </div>
        </div>
        <div className="text-center border-x border-border">
          <div className="text-lg font-bold text-green-600">{passedExams}</div>
          <div className="text-[10px] text-muted-foreground">
            {isArabic ? 'ناجح' : 'Passed'}
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{avgScore}%</div>
          <div className="text-[10px] text-muted-foreground">
            {isArabic ? 'المتوسط' : 'Average'}
          </div>
        </div>
      </div>

      {/* Recent Results */}
      <div className="space-y-2">
        {sortedResults.slice(0, 3).map((result) => {
          const exam = result.exam;
          if (!exam) return null;
          
          const percentage = Math.round((result.score / exam.max_score) * 100);
          const passed = result.score >= exam.pass_mark;
          const examDate = new Date(result.created_at);
          
          return (
            <div 
              key={result.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              {/* Status Icon */}
              <div className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                passed ? "bg-green-500/10" : "bg-red-500/10"
              )}>
                {passed ? (
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {isArabic ? exam.title_ar : exam.title}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(examDate, 'd MMM', { locale: isArabic ? ar : undefined })}
                  </span>
                  <span>•</span>
                  <span>{isArabic ? exam.course?.title_ar : exam.course?.title}</span>
                </div>
              </div>
              
              {/* Score */}
              <div className="text-end shrink-0">
                <div className={cn(
                  "text-sm font-bold",
                  passed ? "text-green-600" : "text-red-600"
                )}>
                  {result.score}/{exam.max_score}
                </div>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[9px] px-1.5 py-0",
                    passed 
                      ? "bg-green-500/10 text-green-600" 
                      : "bg-red-500/10 text-red-600"
                  )}
                >
                  {percentage}%
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* See More Link */}
      {sortedResults.length > 3 && (
        <Button 
          variant="ghost" 
          size="sm" 
          asChild 
          className="w-full mt-3 text-muted-foreground"
        >
          <Link to="/exams">
            {isArabic 
              ? `عرض ${sortedResults.length - 3} امتحان آخر` 
              : `View ${sortedResults.length - 3} more exams`
            }
            <ArrowIcon className="w-4 h-4 ms-1" />
          </Link>
        </Button>
      )}
    </Card>
  );
};
