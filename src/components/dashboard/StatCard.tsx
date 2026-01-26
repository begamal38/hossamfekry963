import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  value: number | string;
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'accent' | 'muted';
  className?: string;
}

const variantStyles = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  accent: 'bg-accent/10 text-accent',
  muted: 'bg-muted text-muted-foreground',
};

export const StatCard: React.FC<StatCardProps> = ({
  icon: Icon,
  value,
  label,
  variant = 'primary',
  className,
}) => {
  return (
    <div
      className={cn(
        // Unified: rounded-lg (10px), consistent with card system
        "bg-card rounded-lg border border-border p-3 sm:p-4",
        className
      )}
    >
      {/* Icon - unified square with rounded corners - EXACT same for all cards */}
      <div className={cn("w-11 h-11 rounded-[12px] flex items-center justify-center mb-3", variantStyles[variant])}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{label}</p>
    </div>
  );
};
