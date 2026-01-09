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
        "bg-card rounded-lg sm:rounded-xl border border-border p-3 sm:p-5 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className={cn("w-8 h-8 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center mb-2 sm:mb-3", variantStyles[variant])}>
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 line-clamp-2">{label}</p>
    </div>
  );
};
