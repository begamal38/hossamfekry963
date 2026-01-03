import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFocusMode, FocusState } from '@/hooks/useFocusMode';
import { Eye, Pause, Timer } from 'lucide-react';

export interface FocusSessionResult {
  startedAt: number;
  totalActiveSeconds: number;
  totalPausedSeconds: number;
  interruptions: number;
  completedSegments: number;
  isCompleted: boolean;
}

export interface FocusModeHandle {
  onVideoPlay: () => void;
  onVideoPause: () => void;
  onVideoEnd: () => void;
  onLessonComplete: () => void;
  resetFocus: () => void;
  getSessionData: () => FocusSessionResult | null;
}

interface FocusModeIndicatorProps {
  lessonId?: string;
  className?: string;
  showMessages?: boolean;
}

export const FocusModeIndicator = forwardRef<FocusModeHandle, FocusModeIndicatorProps>(({
  lessonId,
  className,
  showMessages = true,
}, ref) => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  const {
    focusState,
    isActive,
    isPaused,
    isCompleted,
    currentMessage,
    currentSegmentProgress,
    session,
    startFocus,
    pauseFocus,
    completeFocus,
    resetFocus,
    showRandomMessage,
    showSegmentComplete,
    getFocusStats,
  } = useFocusMode(lessonId);
  
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSegmentCountRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);

  // Track paused time
  useEffect(() => {
    if (isPaused && pauseStartRef.current === null) {
      pauseStartRef.current = Date.now();
    } else if (isActive && pauseStartRef.current !== null) {
      totalPausedTimeRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
  }, [isPaused, isActive]);

  // Track session start
  useEffect(() => {
    if (isActive && sessionStartTimeRef.current === null) {
      sessionStartTimeRef.current = Date.now();
    }
  }, [isActive]);

  // Expose video control methods to parent
  useImperativeHandle(ref, () => ({
    onVideoPlay: () => {
      startFocus();
    },
    onVideoPause: () => {
      pauseFocus();
    },
    onVideoEnd: () => {
      completeFocus();
    },
    onLessonComplete: () => {
      completeFocus();
    },
    resetFocus: () => {
      resetFocus();
      lastSegmentCountRef.current = 0;
      sessionStartTimeRef.current = null;
      totalPausedTimeRef.current = 0;
      pauseStartRef.current = null;
    },
    getSessionData: (): FocusSessionResult | null => {
      const stats = getFocusStats();
      if (!stats || sessionStartTimeRef.current === null) return null;
      
      // Calculate final paused time if currently paused
      let finalPausedSeconds = totalPausedTimeRef.current / 1000;
      if (pauseStartRef.current !== null) {
        finalPausedSeconds += (Date.now() - pauseStartRef.current) / 1000;
      }
      
      return {
        startedAt: sessionStartTimeRef.current,
        totalActiveSeconds: stats.totalMinutes * 60,
        totalPausedSeconds: Math.round(finalPausedSeconds),
        interruptions: stats.interruptions,
        completedSegments: stats.completedSegments,
        isCompleted: isCompleted,
      };
    },
  }), [startFocus, pauseFocus, completeFocus, resetFocus, getFocusStats, isCompleted]);

  // Show segment completion message when a 20-min segment completes
  useEffect(() => {
    if (session && session.completedSegments > lastSegmentCountRef.current) {
      showSegmentComplete(isArabic);
      lastSegmentCountRef.current = session.completedSegments;
    }
  }, [session?.completedSegments, showSegmentComplete, isArabic]);

  // Show random messages at random intervals (6-10 minutes) - ONLY when active
  useEffect(() => {
    if (isActive && showMessages) {
      // Show initial message after 30 seconds
      const initialTimeout = setTimeout(() => {
        showRandomMessage(isArabic);
      }, 30000);

      // Then show messages at random intervals (6-10 minutes)
      const scheduleNextMessage = () => {
        const randomDelay = Math.random() * (600000 - 360000) + 360000;
        return setTimeout(() => {
          if (!document.hidden && isActive) {
            showRandomMessage(isArabic);
          }
          messageIntervalRef.current = scheduleNextMessage();
        }, randomDelay);
      };

      messageIntervalRef.current = scheduleNextMessage();

      return () => {
        clearTimeout(initialTimeout);
        if (messageIntervalRef.current) {
          clearTimeout(messageIntervalRef.current);
        }
      };
    }
  }, [isActive, showMessages, showRandomMessage, isArabic]);

  // Don't render if idle or completed
  if (focusState === 'FOCUS_IDLE' || focusState === 'FOCUS_COMPLETED') {
    return null;
  }

  const stats = getFocusStats();
  const StatusIcon = isPaused ? Pause : Eye;
  
  const statusLabels: Record<FocusState, string> = {
    FOCUS_IDLE: isArabic ? 'جاهز' : 'Ready',
    FOCUS_ACTIVE: isArabic ? 'وضع التركيز' : 'Focus Mode',
    FOCUS_PAUSED: isArabic ? 'متوقف' : 'Paused',
    FOCUS_COMPLETED: isArabic ? 'مكتمل' : 'Completed',
  };

  return (
    <div className={cn("relative flex items-center gap-3", className)}>
      {/* Main indicator - Focus Mode: ON badge */}
      <div 
        className={cn(
          "flex items-center gap-2.5 px-3.5 py-2 rounded-full",
          "bg-card/90 backdrop-blur-md border shadow-lg",
          "transition-all duration-700 ease-out",
          isPaused 
            ? "border-muted/50 opacity-60" 
            : "border-primary/30 shadow-primary/10 focus-mode-on-badge"
        )}
      >
        {/* Breathing indicator dot with enhanced glow */}
        <span className="relative flex items-center justify-center">
          {isActive && (
            <span 
              className={cn(
                "absolute inline-flex h-5 w-5 rounded-full",
                "bg-primary/20 animate-[focus-breathe_7.5s_ease-in-out_infinite]"
              )}
            />
          )}
          <span 
            className={cn(
              "relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-500",
              isPaused ? "bg-muted-foreground/50" : "bg-primary focus-dot-pulse"
            )}
          />
        </span>

        {/* Status text - "Focus Mode: ON" style */}
        <span className={cn(
          "text-sm font-medium transition-colors duration-300",
          isPaused ? "text-muted-foreground" : "text-foreground"
        )}>
          {isPaused 
            ? (isArabic ? 'متوقف' : 'Paused')
            : (isArabic ? 'وضع التركيز: مفعّل' : 'Focus Mode: ON')
          }
        </span>

        {/* Segment progress bar - only shows when ACTIVE */}
        {isActive && (
          <div className="w-12 h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/70 rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${currentSegmentProgress}%` }}
            />
          </div>
        )}

        {/* Icon with subtle animation */}
        <StatusIcon className={cn(
          "w-4 h-4 transition-all duration-300",
          isPaused ? "text-muted-foreground" : "text-primary",
          isActive && "animate-[subtle-pulse_4s_ease-in-out_infinite]"
        )} />
      </div>

      {/* Stats badge - only shows when ACTIVE */}
      {stats && stats.totalMinutes > 0 && isActive && (
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
          "bg-primary/10 border border-primary/20",
          "text-xs font-medium text-primary",
          "animate-fade-in"
        )}>
          <Timer className="w-3 h-3" />
          <span>{stats.totalMinutes} {isArabic ? 'د' : 'm'}</span>
        </div>
      )}

      {/* Floating message */}
      {currentMessage && (
        <div 
          className={cn(
            "absolute top-full right-0 mt-3",
            "px-4 py-2.5 rounded-xl",
            "bg-gradient-to-r from-primary/15 to-primary/5",
            "border border-primary/20",
            "text-sm font-medium text-foreground",
            "whitespace-nowrap shadow-lg",
            "animate-fade-in-up"
          )}
          style={{
            animation: 'fade-in-up 0.4s ease-out, fade-out 0.4s ease-in 3s forwards'
          }}
        >
          {currentMessage}
        </div>
      )}
    </div>
  );
});

FocusModeIndicator.displayName = 'FocusModeIndicator';
