import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LessonStatus = 'completed' | 'in_progress' | 'not_started';

interface LessonStatusBadgeProps {
  status: LessonStatus;
  isRTL?: boolean;
}

const statusConfig = {
  completed: {
    icon: CheckCircle2,
    labelEn: 'Session Completed',
    labelAr: 'الحصة مكتملة',
    className: 'bg-success/10 text-success border-success/20',
  },
  in_progress: {
    icon: Clock,
    labelEn: 'Session In Progress',
    labelAr: 'الحصة جارية',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  not_started: {
    icon: Circle,
    labelEn: 'Session Not Started',
    labelAr: 'الحصة لم تبدأ',
    className: 'bg-muted text-muted-foreground border-border',
  },
};

export const LessonStatusBadge: React.FC<LessonStatusBadgeProps> = ({ status, isRTL }) => {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {isRTL ? config.labelAr : config.labelEn}
    </span>
  );
};
