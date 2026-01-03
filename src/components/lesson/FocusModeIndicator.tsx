import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFocusMode } from '@/hooks/useFocusMode';
import { Eye, Pause, Play } from 'lucide-react';

interface FocusModeIndicatorProps {
  isLessonActive: boolean;
  className?: string;
  showMessages?: boolean;
}

export const FocusModeIndicator: React.FC<FocusModeIndicatorProps> = ({
  isLessonActive,
  className,
  showMessages = true,
}) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const {
    isActive,
    isPaused,
    status,
    currentMessage,
    showRandomMessage,
  } = useFocusMode(isLessonActive);
  
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Show random messages periodically (every 45-90 seconds)
  useEffect(() => {
    if (isActive && !isPaused && showMessages) {
      // Show initial message after 10 seconds
      const initialTimeout = setTimeout(() => {
        showRandomMessage(isArabic);
      }, 10000);

      // Then show messages at random intervals (45-90 seconds)
      messageIntervalRef.current = setInterval(() => {
        const randomDelay = Math.random() * 45000 + 45000; // 45-90 seconds
        setTimeout(() => {
          if (!document.hidden) {
            showRandomMessage(isArabic);
          }
        }, randomDelay);
      }, 60000);

      return () => {
        clearTimeout(initialTimeout);
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
      };
    }
  }, [isActive, isPaused, showMessages, showRandomMessage, isArabic]);

  if (!isActive) return null;

  const StatusIcon = isPaused ? Pause : Eye;
  
  const statusLabels = {
    active: isArabic ? 'تركيز' : 'Focus',
    paused: isArabic ? 'متوقف' : 'Paused',
    resumed: isArabic ? 'عدت!' : 'Welcome back!',
  };

  return (
    <div className={cn("relative", className)}>
      {/* Main indicator */}
      <div 
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full",
          "bg-card/80 backdrop-blur-sm border shadow-sm",
          "transition-all duration-500",
          isPaused ? "border-muted opacity-60" : "border-primary/20"
        )}
      >
        {/* Breathing indicator dot */}
        <span className="relative flex">
          {!isPaused && (
            <span 
              className={cn(
                "absolute inline-flex h-3 w-3 rounded-full",
                "bg-primary/40 animate-[focus-breathe_7s_ease-in-out_infinite]"
              )}
            />
          )}
          <span 
            className={cn(
              "relative inline-flex h-3 w-3 rounded-full",
              isPaused ? "bg-muted-foreground/50" : "bg-primary"
            )}
          />
        </span>

        {/* Status text */}
        <span className={cn(
          "text-xs font-medium",
          isPaused ? "text-muted-foreground" : "text-foreground"
        )}>
          {statusLabels[status === 'idle' ? 'active' : status]}
        </span>

        {/* Icon */}
        <StatusIcon className={cn(
          "w-3.5 h-3.5",
          isPaused ? "text-muted-foreground" : "text-primary"
        )} />
      </div>

      {/* Floating message */}
      {currentMessage && (
        <div 
          className={cn(
            "absolute top-full left-1/2 -translate-x-1/2 mt-2",
            "px-3 py-1.5 rounded-lg",
            "bg-primary/10 border border-primary/20",
            "text-xs font-medium text-primary",
            "whitespace-nowrap",
            "animate-fade-in-up",
            "pointer-events-none"
          )}
          style={{
            animation: 'fade-in-up 0.3s ease-out, fade-out 0.3s ease-in 2s forwards'
          }}
        >
          {currentMessage}
        </div>
      )}
    </div>
  );
};
