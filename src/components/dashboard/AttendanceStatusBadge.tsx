import React from 'react';
import { Check, X, Building, Globe, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AttendanceStatus = 'center' | 'online' | 'both' | 'absent';

interface AttendanceStatusBadgeProps {
  status: AttendanceStatus;
  isRTL?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const STATUS_CONFIG: Record<AttendanceStatus, {
  labelAr: string;
  labelEn: string;
  icon: typeof Check;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  center: {
    labelAr: 'حضور سنتر',
    labelEn: 'Center',
    icon: Building,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  online: {
    labelAr: 'أونلاين',
    labelEn: 'Online',
    icon: Globe,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/30',
  },
  both: {
    labelAr: 'حضور كامل',
    labelEn: 'Full Attendance',
    icon: Layers,
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-500/30',
  },
  absent: {
    labelAr: 'غائب',
    labelEn: 'Absent',
    icon: X,
    bgColor: 'bg-red-500/10',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-500/30',
  },
};

const SIZE_CONFIG = {
  sm: {
    padding: 'px-2 py-0.5',
    iconSize: 'h-3 w-3',
    textSize: 'text-xs',
  },
  md: {
    padding: 'px-2.5 py-1',
    iconSize: 'h-4 w-4',
    textSize: 'text-sm',
  },
  lg: {
    padding: 'px-3 py-1.5',
    iconSize: 'h-5 w-5',
    textSize: 'text-base',
  },
};

export const AttendanceStatusBadge: React.FC<AttendanceStatusBadgeProps> = ({
  status,
  isRTL = false,
  size = 'md',
  showLabel = true,
}) => {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium',
        config.bgColor,
        config.textColor,
        config.borderColor,
        sizeConfig.padding,
        sizeConfig.textSize
      )}
    >
      <Icon className={sizeConfig.iconSize} />
      {showLabel && (
        <span>{isRTL ? config.labelAr : config.labelEn}</span>
      )}
    </span>
  );
};

export const getAttendanceStatus = (
  centerAttended: boolean,
  onlineCompleted: boolean
): AttendanceStatus => {
  if (centerAttended && onlineCompleted) return 'both';
  if (centerAttended) return 'center';
  if (onlineCompleted) return 'online';
  return 'absent';
};
