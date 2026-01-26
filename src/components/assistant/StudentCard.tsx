import React from 'react';
import { User, Phone, GraduationCap, TrendingUp, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StudentCardProps {
  id: string;
  userId: string;
  name: string;
  phone?: string;
  grade?: string;
  enrolledCourses: number;
  completedLessons: number;
  totalLessons: number;
  examsTaken: number;
  examsPending: number;
  isRTL?: boolean;
  onClick?: () => void;
}

// Supports both normalized format (second_secondary) and legacy combined format
const gradeLabels: Record<string, { ar: string; en: string }> = {
  'first': { ar: 'أولى ثانوي', en: '1st Sec' },
  'second_secondary': { ar: 'تانية ثانوي', en: '2nd Sec' },
  'third_secondary': { ar: 'تالته ثانوي', en: '3rd Sec' },
  // Legacy combined format (kept for backwards compatibility)
  'second_arabic': { ar: 'ثانية عربي', en: '2nd Arabic' },
  'second_languages': { ar: 'ثانية لغات', en: '2nd Lang' },
  'third_arabic': { ar: 'ثالثة عربي', en: '3rd Arabic' },
  'third_languages': { ar: 'ثالثة لغات', en: '3rd Lang' },
};

export const StudentCard: React.FC<StudentCardProps> = ({
  id,
  userId,
  name,
  phone,
  grade,
  enrolledCourses,
  completedLessons,
  totalLessons,
  examsTaken,
  examsPending,
  isRTL,
  onClick,
}) => {
  const progressPercent = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  const gradeLabel = grade && gradeLabels[grade] 
    ? (isRTL ? gradeLabels[grade].ar : gradeLabels[grade].en)
    : (isRTL ? 'غير محدد' : 'N/A');

  return (
    <div 
      className="bg-card rounded-lg border border-border p-5 hover:border-primary/30 hover:shadow-md transition-all duration-150 cursor-pointer active:scale-[0.98]"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name || (isRTL ? 'بدون اسم' : 'No name')}</h3>
            {phone && (
              <p className="text-sm text-muted-foreground flex items-center gap-1" dir="ltr">
                <Phone className="w-3 h-3" />
                {phone}
              </p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <GraduationCap className="w-3 h-3" />
          {gradeLabel}
        </Badge>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            {isRTL ? 'التقدم' : 'Progress'}
          </span>
          <span className="font-medium text-foreground">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-muted/50">
          <p className="text-lg font-bold text-foreground">{enrolledCourses}</p>
          <p className="text-xs text-muted-foreground">{isRTL ? 'كورسات' : 'Courses'}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-success/10">
          <p className="text-lg font-bold text-success">{examsTaken}</p>
          <p className="text-xs text-muted-foreground">{isRTL ? 'امتحانات' : 'Exams'}</p>
        </div>
        <div className="text-center p-2 rounded-lg bg-warning/10">
          <p className="text-lg font-bold text-warning">{examsPending}</p>
          <p className="text-xs text-muted-foreground">{isRTL ? 'معلق' : 'Pending'}</p>
        </div>
      </div>

      {/* View Details Button */}
      <Button 
        variant="outline" 
        className="w-full gap-2" 
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {isRTL ? 'عرض التفاصيل' : 'View Details'}
        <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
      </Button>
    </div>
  );
};
