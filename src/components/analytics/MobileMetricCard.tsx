import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subValue?: string;
  colorClass?: string;
  bgClass?: string;
  trend?: 'up' | 'down' | 'neutral';
}

/**
 * Compact mobile-first metric card
 * Vodafone-style: one metric per row, clean, minimal
 */
export const MobileMetricCard: React.FC<MobileMetricCardProps> = ({
  icon: Icon,
  label,
  value,
  subValue,
  colorClass = 'text-primary',
  bgClass = 'bg-primary/10',
  trend
}) => {
  return (
    <div className="bg-card border border-border rounded-md p-3 flex items-center gap-3">
      <div className={cn("p-2 rounded-md shrink-0", bgClass)}>
        <Icon className={cn("h-4 w-4", colorClass)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <span className={cn("text-lg font-bold", colorClass)}>{value}</span>
          {subValue && (
            <span className="text-xs text-muted-foreground">{subValue}</span>
          )}
        </div>
      </div>
      {trend && (
        <div className={cn(
          "text-xs font-medium px-1.5 py-0.5 rounded",
          trend === 'up' && "bg-green-500/10 text-green-600",
          trend === 'down' && "bg-red-500/10 text-red-600",
          trend === 'neutral' && "bg-muted text-muted-foreground"
        )}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '–'}
        </div>
      )}
    </div>
  );
};

export default MobileMetricCard;
