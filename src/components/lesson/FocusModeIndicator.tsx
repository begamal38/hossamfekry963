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
    showTimeMilestone,
    getFocusStats,
  } = useFocusMode(lessonId);
  
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSegmentCountRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);
  const pauseStartRef = useRef<number | null>(null);
  const shownMilestonesRef = useRef<Set<number>>(new Set());

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

  // ═══════════════════════════════════════════════════════════════════
  // IMPERATIVE HANDLE — STRICT FOCUS ORCHESTRATION
  // These methods enforce single-execution guards defined in useFocusMode
  // ═══════════════════════════════════════════════════════════════════
  useImperativeHandle(ref, () => ({
    onVideoPlay: () => {
      // GUARD: useFocusMode.startFocus() already prevents double-start
      // - Returns early if focusState === FOCUS_ACTIVE
      // - Returns early if isCompletedRef === true
      startFocus();
    },
    onVideoPause: () => {
      // GUARD: useFocusMode.pauseFocus() only executes if FOCUS_ACTIVE
      pauseFocus();
    },
    onVideoEnd: () => {
      // completeFocus() marks session as FOCUS_COMPLETED
      // This prevents any future startFocus() calls
      completeFocus();
    },
    onLessonComplete: () => {
      // Same as onVideoEnd - explicit completion
      completeFocus();
    },
    resetFocus: () => {
      // Full reset - clears all guards and refs
      resetFocus();
      lastSegmentCountRef.current = 0;
      sessionStartTimeRef.current = null;
      totalPausedTimeRef.current = 0;
      pauseStartRef.current = null;
      shownMilestonesRef.current = new Set();
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

  // Show time milestone messages at 1, 5, 10, 15, 30, 45, 60 minutes
  useEffect(() => {
    if (!isActive || !showMessages) return;
    
    const milestones = [1, 5, 10, 15, 30, 45, 60];
    
    const checkMilestones = () => {
      const stats = getFocusStats();
      if (!stats) return;
      
      const currentMinutes = stats.totalMinutes;
      
      for (const milestone of milestones) {
        if (currentMinutes >= milestone && !shownMilestonesRef.current.has(milestone)) {
          shownMilestonesRef.current.add(milestone);
          showTimeMilestone(milestone, isArabic);
          break; // Only show one milestone at a time
        }
      }
    };
    
    // Check every 5 seconds for milestone completion
    const interval = setInterval(checkMilestones, 5000);
    
    return () => clearInterval(interval);
  }, [isActive, showMessages, getFocusStats, showTimeMilestone, isArabic]);

  // ═══════════════════════════════════════════════════════════════════
  // MOTIVATIONAL MESSAGES — ONLY WHEN FOCUS_ACTIVE
  // Show random motivational messages at random intervals (4-6 minutes)
  // GUARD: Messages only display when isActive AND document.hidden === false
  // ═══════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (isActive && showMessages) {
      // Show initial message after 30 seconds
      const initialTimeout = setTimeout(() => {
        // GUARD: Check visibility before showing message
        if (!document.hidden) {
          showRandomMessage(isArabic);
        }
      }, 30000);

      // Schedule next message at random interval (4-6 minutes = 240000-360000ms)
      const scheduleNextMessage = () => {
        const randomDelay = Math.random() * (360000 - 240000) + 240000; // 4-6 minutes
        return setTimeout(() => {
          // GUARD: Double-check visibility AND active state before showing
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
    FOCUS_ACTIVE: isArabic ? 'وضع التركيز: مفعّل' : 'Focus Mode: Active',
    FOCUS_PAUSED: isArabic ? 'متوقف' : 'Paused',
    FOCUS_COMPLETED: isArabic ? 'مكتمل' : 'Completed',
  };

  return (
    <div className={cn("relative flex items-center gap-3", className)} dir="ltr">
      {/* Main indicator - Focus Mode: ON badge */}
      <div 
        className={cn(
          "flex items-center gap-2.5 px-3.5 py-2 rounded-full",
          "bg-card/90 backdrop-blur-md border shadow-lg",
          "transition-all duration-500 ease-out",
          "focus-mode-expand-animation",
          "motion-reduce:transition-none motion-reduce:animate-none",
          isPaused 
            ? "border-muted/50 opacity-60" 
            : "border-[hsl(142_71%_45%/0.3)] shadow-[0_0_12px_-4px_hsl(142_71%_45%/0.2)] focus-mode-on-badge"
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
              "relative inline-flex h-2.5 w-2.5 rounded-full transition-colors duration-500",
              isPaused 
                ? "bg-muted-foreground/50" 
                : "bg-[#22C55E] animate-subtle-pulse motion-reduce:animate-none"
            )}
          />
        </span>

        {/* Status text - "Focus Mode: Active" style - Always LTR */}
        <span className={cn(
          "text-sm font-medium transition-colors duration-300",
          isPaused ? "text-muted-foreground" : "text-foreground"
        )}>
          {isPaused 
            ? (isArabic ? 'متوقف' : 'Paused')
            : (isArabic ? 'وضع التركيز: مفعّل' : 'Focus Mode: Active')
          }
        </span>

        {/* Segment progress bar - only shows when ACTIVE */}
        {isActive && (
          <div className="w-12 h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[hsl(142_71%_45%/0.7)] rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${currentSegmentProgress}%` }}
            />
          </div>
        )}

        {/* Icon with subtle animation */}
        <StatusIcon className={cn(
          "w-4 h-4 transition-all duration-300",
          isPaused 
            ? "text-muted-foreground" 
            : "text-[#22C55E] animate-[subtle-pulse_4s_ease-in-out_infinite] motion-reduce:animate-none"
        )} />
      </div>

      {/* Stats badge - only shows when ACTIVE */}
      {stats && stats.totalMinutes > 0 && isActive && (
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full",
          "bg-[hsl(142_71%_45%/0.1)] border border-[hsl(142_71%_45%/0.2)]",
          "text-xs font-medium text-[#22C55E]",
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
            "bg-gradient-to-r from-[hsl(142_71%_45%/0.15)] to-[hsl(142_71%_45%/0.05)]",
            "border border-[hsl(142_71%_45%/0.2)]",
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
