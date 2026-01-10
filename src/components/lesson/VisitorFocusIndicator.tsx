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
 * Uses centralized translation keys for consistency
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
        isActive 
          ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400"
          : "bg-muted/50 border-muted text-muted-foreground",
        className
      )}
    >
      {/* Breathing indicator dot when active */}
      <span className="relative flex items-center justify-center">
        {isActive && (
          <span 
            className="absolute inline-flex h-4 w-4 rounded-full bg-green-500/20 animate-ping"
            style={{ animationDuration: '2s' }}
          />
        )}
        <span 
          className={cn(
            "relative inline-flex h-2 w-2 rounded-full transition-colors duration-300",
            isActive ? "bg-green-500" : "bg-muted-foreground/50"
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