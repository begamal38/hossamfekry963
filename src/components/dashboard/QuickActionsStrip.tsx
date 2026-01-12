import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuickAction {
  icon: LucideIcon;
  label: string;
  href: string;
  color?: string;
  bgColor?: string;
  badge?: string;
}

interface QuickActionsStripProps {
  actions: QuickAction[];
  isRTL?: boolean;
  className?: string;
}

export const QuickActionsStrip: React.FC<QuickActionsStripProps> = ({
  actions,
  isRTL = false,
  className,
}) => {
  return (
    <div className={cn("w-full overflow-x-auto scrollbar-hide -mx-3 px-3", className)}>
      <div className="flex gap-3 pb-1" style={{ minWidth: 'max-content' }}>
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link
              key={index}
              to={action.href}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-3 rounded-xl border border-border bg-card relative",
                "min-w-[80px] sm:min-w-[90px] hover:border-primary/40 hover:bg-muted/50 transition-all duration-200",
                "active:scale-95"
              )}
            >
              {action.badge && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {action.badge}
                </span>
              )}
              <div
                className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center",
                  action.bgColor || "bg-primary/10"
                )}
              >
                <Icon className={cn("w-5 h-5 sm:w-5.5 sm:h-5.5", action.color || "text-primary")} />
              </div>
              <span className="text-[11px] sm:text-xs font-medium text-foreground text-center leading-tight line-clamp-2">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
