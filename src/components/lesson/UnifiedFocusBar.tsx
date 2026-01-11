import React, { useState, useEffect, useRef } from 'react';
import { Eye, Pause, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserType } from '@/hooks/useUnifiedFocusState';
import { useLanguage } from '@/contexts/LanguageContext';

interface UnifiedFocusBarProps {
  userType: UserType;
  isFocusActive: boolean;
  remainingSeconds?: number; // Only for visitors
  isTimerRunning?: boolean; // Only for visitors
  hasPlaybackStarted: boolean;
  className?: string;
}

/**
 * Unified Focus Bar component that works across all user states.
 * Collapsible with auto-expand on important events.
 * Uses centralized translation keys for consistency.
 * 
 * Design:
 * - Default: Collapsed (shows only pulsing dot)
 * - Expands on: focus activation, <60s remaining
 * - Auto-collapses after 3s of inactivity
 * - Manual toggle available
 */
export const UnifiedFocusBar: React.FC<UnifiedFocusBarProps> = ({
  userType,
  isFocusActive,
  remainingSeconds = 0,
  isTimerRunning = false,
  hasPlaybackStarted,
  className,
}) => {
  const { t, isRTL } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wasActiveRef = useRef(false);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Auto-expand logic
  useEffect(() => {
    // Expand when focus activates for the first time
    if (isFocusActive && !wasActiveRef.current) {
      setIsExpanded(true);
      wasActiveRef.current = true;
    }

    // Expand when remaining time < 60 seconds (for visitors)
    if (userType === 'visitor' && remainingSeconds > 0 && remainingSeconds <= 60) {
      setIsExpanded(true);
    }
  }, [isFocusActive, userType, remainingSeconds]);

  // Auto-collapse after 3 seconds
  useEffect(() => {
    if (isExpanded && isFocusActive) {
      // Clear any existing timeout
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }

      // Don't auto-collapse if remaining time is critical (< 60s)
      if (userType === 'visitor' && remainingSeconds <= 60 && remainingSeconds > 0) {
        return;
      }

      collapseTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 3000);
    }

    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, [isExpanded, isFocusActive, userType, remainingSeconds]);

  // Don't render until playback has started
  if (!hasPlaybackStarted) {
    return null;
  }

  // Get state-specific text - hardcoded Arabic copy per spec
  const getText = () => {
    if (userType === 'visitor') {
      if (isFocusActive) {
        return {
          // Spec: "معاينة سريعة للحصة 👀" + "المتبقي من المعاينة: {mm:ss}"
          title: 'معاينة سريعة للحصة 👀',
          subtitle: null,
          timer: `المتبقي من المعاينة: ${formatTime(remainingSeconds)}`,
        };
      } else {
        return {
          title: t('focus.paused'),
          subtitle: t('focus.resumeVideo'),
          timer: `المتبقي من المعاينة: ${formatTime(remainingSeconds)}`,
        };
      }
    } else if (userType === 'student') {
      // Logged-in student (not enrolled) - FREE TRIAL
      if (isFocusActive) {
        return {
          // Spec: "دي حصة مجانية — تقدر تشوفها كاملة"
          title: 'دي حصة مجانية — تقدر تشوفها كاملة 👌',
          subtitle: null,
          timer: null,
        };
      } else {
        return {
          title: t('focus.paused'),
          subtitle: null,
          timer: null,
        };
      }
    } else {
      // Enrolled student
      if (isFocusActive) {
        return {
          // Spec: "وضع التركيز نشط"
          title: 'وضع التركيز نشط',
          subtitle: null,
          timer: null,
        };
      } else {
        return {
          title: t('focus.paused'),
          subtitle: null,
          timer: null,
        };
      }
    }
  };

  const text = getText();
  const isWarning = userType === 'visitor' && remainingSeconds <= 60 && remainingSeconds > 0;

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    // Reset auto-collapse timer on manual interaction
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
    }
  };

  return (
    <div
      dir={isRTL ? 'rtl' : 'ltr'}
      className={cn(
        "flex items-center gap-2 transition-all duration-300 rounded-full",
        "border backdrop-blur-sm cursor-pointer select-none",
        isFocusActive
          ? isWarning
            ? "bg-destructive/10 border-destructive/30"
            : "bg-primary/10 border-primary/30"
          : "bg-muted/50 border-muted",
        isExpanded ? "px-4 py-2" : "px-3 py-2",
        className
      )}
      onClick={handleToggle}
    >
      {/* Pulsing dot indicator - always visible */}
      <span className="relative flex items-center justify-center flex-shrink-0">
        {isFocusActive && (
          <span 
            className={cn(
              "absolute inline-flex h-4 w-4 rounded-full animate-ping",
              isWarning ? "bg-destructive/20" : "bg-primary/20"
            )}
            style={{ animationDuration: '2s' }}
          />
        )}
        <span 
          className={cn(
            "relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-300",
            isFocusActive 
              ? isWarning 
                ? "bg-destructive" 
                : "bg-primary"
              : "bg-muted-foreground/50"
          )}
        />
      </span>

      {/* Icon */}
      {isFocusActive ? (
        <Eye className={cn(
          "w-4 h-4 flex-shrink-0",
          isWarning ? "text-destructive" : "text-primary"
        )} />
      ) : (
        <Pause className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="flex flex-col min-w-0 animate-fade-in">
          <span className={cn(
            "text-sm font-medium truncate",
            isFocusActive
              ? isWarning
                ? "text-destructive"
                : "text-primary"
              : "text-muted-foreground"
          )}>
            {text.title}
          </span>
          
          {text.subtitle && (
            <span className="text-xs text-muted-foreground truncate">
              {text.subtitle}
            </span>
          )}
          
          {userType === 'visitor' && text.timer && (
            <span className={cn(
              "text-xs font-medium mt-0.5",
              isWarning ? "text-destructive" : "text-primary"
            )}>
              {text.timer}
            </span>
          )}
        </div>
      )}

      {/* Expand/Collapse indicator */}
      <div className="flex-shrink-0">
        {isExpanded ? (
          <ChevronUp className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        )}
      </div>
    </div>
  );
};