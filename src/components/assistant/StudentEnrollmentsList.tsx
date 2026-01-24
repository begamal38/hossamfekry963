import React from 'react';
import { BookOpen, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CourseActivitySummary } from '@/hooks/useCourseActivitySummary';

interface Enrollment {
  id: string;
  course_id: string;
  status: string;
  progress: number | null;
  completed_lessons: number | null;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    title_ar: string;
    lessons_count: number | null;
  };
}

interface StudentEnrollmentsListProps {
  enrollments: Enrollment[];
  activitySummaries: Map<string, CourseActivitySummary>;
  onViewSummary: (summary: CourseActivitySummary) => void;
  isArabic: boolean;
}

const getStatusConfig = (status: string, isArabic: boolean) => {
  switch (status) {
    case 'active':
      return { label: isArabic ? 'نشط' : 'Active', variant: 'default' as const, className: 'bg-green-600' };
    case 'pending':
      return { label: isArabic ? 'معلق' : 'Pending', variant: 'secondary' as const, className: '' };
    case 'suspended':
      return { label: isArabic ? 'موقوف' : 'Suspended', variant: 'destructive' as const, className: '' };
    case 'expired':
      return { label: isArabic ? 'منتهي' : 'Expired', variant: 'outline' as const, className: 'text-muted-foreground' };
    default:
      return { label: status, variant: 'outline' as const, className: '' };
  }
};

export const StudentEnrollmentsList: React.FC<StudentEnrollmentsListProps> = ({
  enrollments,
  activitySummaries,
  onViewSummary,
  isArabic,
}) => {
  if (enrollments.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
          <BookOpen className="h-5 w-5 text-primary" />
          {isArabic ? 'الكورسات المشترك فيها' : 'Enrolled Courses'}
        </h3>
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">
            {isArabic ? 'لا توجد اشتراكات حالية' : 'No current enrollments'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
      <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
        <BookOpen className="h-5 w-5 text-primary" />
        {isArabic ? 'الكورسات المشترك فيها' : 'Enrolled Courses'}
        <Badge variant="secondary" className="mr-auto text-xs">
          {enrollments.length}
        </Badge>
      </h3>

      <div className="space-y-3">
        {enrollments.map(enrollment => {
          const statusConfig = getStatusConfig(enrollment.status, isArabic);
          const progressPercent = enrollment.progress || 0;
          const hasSummary = enrollment.status === 'expired' && activitySummaries.has(enrollment.course_id);

          return (
            <div 
              key={enrollment.id} 
              className="bg-muted/30 rounded-lg p-4 border border-border/50"
            >
              {/* Course Title + Status */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <p className="font-medium text-foreground leading-tight">
                  {isArabic ? enrollment.course?.title_ar : enrollment.course?.title}
                </p>
                <Badge variant={statusConfig.variant} className={statusConfig.className}>
                  {statusConfig.label}
                </Badge>
              </div>

              {/* Lessons Progress */}
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>
                  {enrollment.completed_lessons || 0} / {enrollment.course?.lessons_count || 0}{' '}
                  {isArabic ? 'درس' : 'lessons'}
                </span>
                <span className="font-medium text-foreground">{progressPercent}%</span>
              </div>

              {/* Progress Bar */}
              <Progress 
                value={progressPercent} 
                className={`h-2 ${
                  progressPercent >= 70 ? '[&>div]:bg-green-500' : 
                  progressPercent >= 40 ? '[&>div]:bg-amber-500' : 
                  '[&>div]:bg-primary'
                }`}
              />

              {/* Enrollment Date */}
              <p className="text-xs text-muted-foreground mt-2">
                {isArabic ? 'تاريخ الاشتراك:' : 'Enrolled:'}{' '}
                {new Date(enrollment.enrolled_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
              </p>

              {/* Activity Summary Button for expired */}
              {hasSummary && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full gap-2 text-xs"
                  onClick={() => onViewSummary(activitySummaries.get(enrollment.course_id)!)}
                >
                  <Gauge className="h-3.5 w-3.5" />
                  {isArabic ? 'ملخص النشاط' : 'Activity Summary'}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
