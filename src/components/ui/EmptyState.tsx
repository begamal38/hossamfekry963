import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon displayed in the empty state */
  icon?: LucideIcon;
  /** Main title text */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button label */
  actionLabel?: string;
  /** Action button callback */
  onAction?: () => void;
  /** Action button href (for Link-based actions) */
  href?: string;
  /** Visual variant for different contexts */
  variant?: 'default' | 'compact' | 'card';
  /** Additional class names */
  className?: string;
  /** Is RTL mode */
  isRTL?: boolean;
}

/**
 * Unified Empty State Component
 * Provides consistent empty state UI across the platform
 * with calm, helpful messaging and optional actions.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  href,
  variant = 'default',
  className,
  isRTL = false,
}) => {
  const isCompact = variant === 'compact';
  const isCard = variant === 'card';

  const content = (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        // Spacing based on variant
        isCompact ? "py-6 px-3" : "py-12 px-4",
        // Card variant adds background and border
        isCard && "bg-card rounded-2xl border border-border shadow-sm",
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Icon Container - Unified styling */}
      <div
        className={cn(
          "rounded-2xl bg-muted/60 flex items-center justify-center",
          isCompact ? "w-12 h-12 mb-3" : "w-16 h-16 mb-4"
        )}
      >
        <Icon
          className={cn(
            "text-muted-foreground/60",
            isCompact ? "w-6 h-6" : "w-8 h-8"
          )}
        />
      </div>

      {/* Title */}
      <h3
        className={cn(
          "font-semibold text-foreground mb-1",
          isCompact ? "text-sm" : "text-base"
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            "text-muted-foreground max-w-xs leading-relaxed",
            isCompact ? "text-xs" : "text-sm",
            actionLabel ? "mb-4" : "mb-0"
          )}
        >
          {description}
        </p>
      )}

      {/* Action Button */}
      {actionLabel && (onAction || href) && (
        <Button
          onClick={onAction}
          size={isCompact ? "sm" : "default"}
          variant="outline"
          className="mt-2"
          asChild={!!href}
        >
          {href ? (
            <a href={href}>{actionLabel}</a>
          ) : (
            <span>{actionLabel}</span>
          )}
        </Button>
      )}
    </div>
  );

  return content;
};

export default EmptyState;
