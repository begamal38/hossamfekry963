import React from 'react';
import { CheckCircle2, Circle, Clock, Play, Building, Globe, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type LessonAttendanceStatus = 'center' | 'online' | 'both' | 'not_attended';

export interface LessonActivity {
  id: string;
  title: string;
  courseName: string;
  isCompleted: boolean;
  isLastAccessed?: boolean;
  timeSpent?: string;
  attendanceStatus?: LessonAttendanceStatus;
}

interface LessonActivityListProps {
  lessons: LessonActivity[];
  isRTL?: boolean;
  onLessonClick?: (lessonId: string) => void;
}

const ATTENDANCE_STATUS_CONFIG: Record<LessonAttendanceStatus, {
  labelAr: string;
  labelEn: string;
  icon: typeof Building;
  color: string;
  bgColor: string;
}> = {
  center: {
    labelAr: 'حضور سنتر',
    labelEn: 'Center',
    icon: Building,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  online: {
    labelAr: 'أونلاين',
    labelEn: 'Online',
    icon: Globe,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  both: {
    labelAr: 'حضور كامل',
    labelEn: 'Full',
    icon: Layers,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
  },
  not_attended: {
    labelAr: 'لم يحضر',
    labelEn: 'Not Attended',
    icon: Circle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

export const LessonActivityList: React.FC<LessonActivityListProps> = ({
  lessons,
  isRTL,
  onLessonClick,
}) => {
  if (lessons.length === 0) {
    return (
      <div className="text-center py-8">
        <Circle className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground">
          {isRTL ? 'لا توجد دروس بعد' : 'No lessons yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {lessons.map((lesson) => {
        const attendanceConfig = lesson.attendanceStatus 
          ? ATTENDANCE_STATUS_CONFIG[lesson.attendanceStatus]
          : null;
        const AttendanceIcon = attendanceConfig?.icon || Circle;

        return (
          <div
            key={lesson.id}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border transition-colors",
              lesson.isLastAccessed 
                ? "bg-primary/5 border-primary/20" 
                : "bg-card border-border hover:bg-muted/50"
            )}
          >
            {/* Status Icon */}
            <div
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0",
                lesson.isCompleted 
                  ? "bg-success/10 text-success" 
                  : attendanceConfig?.bgColor || "bg-muted text-muted-foreground"
              )}
            >
              {lesson.isCompleted ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : attendanceConfig && lesson.attendanceStatus !== 'not_attended' ? (
                <AttendanceIcon className={cn("w-5 h-5", attendanceConfig.color)} />
              ) : (
                <Circle className="w-5 h-5" />
              )}
            </div>
            
            {/* Lesson Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium text-foreground truncate">{lesson.title}</h4>
                {lesson.isLastAccessed && (
                  <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {isRTL ? 'آخر درس' : 'Last accessed'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground truncate">{lesson.courseName}</p>
                {/* Attendance Badge */}
                {attendanceConfig && lesson.attendanceStatus !== 'not_attended' && (
                  <span className={cn(
                    "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full",
                    attendanceConfig.bgColor,
                    attendanceConfig.color
                  )}>
                    <AttendanceIcon className="w-3 h-3" />
                    {isRTL ? attendanceConfig.labelAr : attendanceConfig.labelEn}
                  </span>
                )}
              </div>
            </div>
            
            {/* Time Spent */}
            {lesson.timeSpent && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{lesson.timeSpent}</span>
              </div>
            )}
            
            {/* Play Button */}
            {!lesson.isCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLessonClick?.(lesson.id)}
                className="flex-shrink-0"
              >
                <Play className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
};
