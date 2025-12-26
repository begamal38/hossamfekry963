import React from 'react';
import { Globe, MapPin, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AttendanceMode = 'online' | 'center' | 'hybrid';

interface AttendanceModeBadgeProps {
  mode: AttendanceMode;
  isRTL?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const MODE_CONFIG: Record<AttendanceMode, {
  labelAr: string;
  labelEn: string;
  icon: typeof Globe;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  online: {
    labelAr: 'أونلاين',
    labelEn: 'Online',
    icon: Globe,
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-500/30',
  },
  center: {
    labelAr: 'سنتر',
    labelEn: 'Center',
    icon: MapPin,
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  hybrid: {
    labelAr: 'هجين',
    labelEn: 'Hybrid',
    icon: Layers,
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-500/30',
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

export const AttendanceModeBadge: React.FC<AttendanceModeBadgeProps> = ({
  mode,
  isRTL = false,
  size = 'md',
  showLabel = true,
}) => {
  const config = MODE_CONFIG[mode];
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
