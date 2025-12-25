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
        "bg-card rounded-xl border border-border p-5 transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className={cn("w-11 h-11 rounded-lg flex items-center justify-center mb-3", variantStyles[variant])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );
};
