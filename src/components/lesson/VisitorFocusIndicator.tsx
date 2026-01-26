import React from 'react';
import { Eye, Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface VisitorFocusIndicatorProps {
  isActive: boolean;
  className?: string;
}

/**
 * Simple Focus Mode indicator for visitors
 * Shows whether focus validation is active or paused
 * Uses rich green (#22C55E) with calm 2s breathing animation
 * Visible ONLY to visitors (not logged in) during free lesson preview
 */
export const VisitorFocusIndicator: React.FC<VisitorFocusIndicatorProps> = ({
  isActive,
  className,
}) => {
  const { t, isRTL } = useLanguage();
  const Icon = isActive ? Eye : Pause;

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
        "border transition-all duration-300",
        "motion-reduce:transition-none",
        isActive 
          ? "bg-[hsl(142_71%_45%/0.08)] border-[hsl(142_71%_45%/0.25)] text-[#22C55E]"
          : "bg-muted/50 border-muted text-muted-foreground",
        className
      )}
    >
      {/* Breathing indicator dot - unified green pulse */}
      <span className="relative flex items-center justify-center">
        {isActive && (
          <span 
            className={cn(
              "absolute inline-flex h-4 w-4 rounded-full",
              "bg-[hsl(142_71%_45%/0.25)]",
              "animate-focus-breathe",
              "motion-reduce:animate-none"
            )}
          />
        )}
        <span 
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full transition-colors duration-300",
            isActive 
              ? "bg-[#22C55E] animate-subtle-pulse motion-reduce:animate-none" 
              : "bg-muted-foreground/50"
          )}
        />
      </span>
      
      <Icon className="w-4 h-4" />
      
      <span>
        {isActive ? t('focus.active') : t('focus.paused')}
      </span>
    </div>
  );
};
