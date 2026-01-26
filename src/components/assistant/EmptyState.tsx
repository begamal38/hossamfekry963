import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Helpful hint for what to do next */
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Compact variant for smaller spaces */
  compact?: boolean;
}

/**
 * Assistant Empty State Component
 * Consistent empty state styling for assistant dashboard views
 * with calm, helpful messaging
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  hint,
  actionLabel,
  onAction,
  className,
  compact = false,
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center",
      compact ? "py-8 px-3" : "py-12 px-4",
      className
    )}>
      {/* Icon container with unified rounded-2xl styling */}
      <div className={cn(
        "rounded-2xl bg-muted/60 flex items-center justify-center",
        compact ? "w-12 h-12 mb-3" : "w-16 h-16 mb-4"
      )}>
        <Icon className={cn(
          "text-muted-foreground/60",
          compact ? "w-6 h-6" : "w-8 h-8"
        )} />
      </div>
      
      {/* Title */}
      <h3 className={cn(
        "font-semibold text-foreground mb-1",
        compact ? "text-sm" : "text-base"
      )}>
        {title}
      </h3>
      
      {/* Description */}
      {description && (
        <p className={cn(
          "text-muted-foreground max-w-xs leading-relaxed",
          compact ? "text-xs" : "text-sm",
          (hint || actionLabel) ? "mb-2" : "mb-0"
        )}>
          {description}
        </p>
      )}
      
      {/* Helpful hint - calm, non-pushy */}
      {hint && (
        <p className={cn(
          "text-muted-foreground/80 max-w-xs italic",
          compact ? "text-[10px]" : "text-xs",
          actionLabel ? "mb-3" : "mb-0"
        )}>
          💡 {hint}
        </p>
      )}
      
      {/* Action button with outline variant for secondary emphasis */}
      {actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          size={compact ? "sm" : "default"} 
          variant="outline"
          className="mt-2"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};