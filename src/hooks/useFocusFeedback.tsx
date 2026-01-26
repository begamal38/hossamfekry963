import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * Focus Feedback Hook - Provides calm, non-blocking feedback for focus state changes
 * 
 * Design principles:
 * - Subtle feedback only (no alerts, no sounds)
 * - Debounced to prevent rapid-fire notifications
 * - Uses toast.info for paused, toast.success for resumed
 * - Arabic-first with proper RTL display
 */
export const useFocusFeedback = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  // Debounce refs to prevent rapid-fire toasts
  const lastPauseTimeRef = useRef<number>(0);
  const lastResumeTimeRef = useRef<number>(0);
  const DEBOUNCE_MS = 2000; // Minimum 2s between same-type toasts
  
  // Track if we've shown initial resume (to avoid showing on first play)
  const hasShownInitialRef = useRef(false);

  /**
   * Show pause feedback - subtle, non-blocking
   */
  const showPauseFeedback = useCallback((reason?: 'video_paused' | 'tab_inactive' | 'page_hidden') => {
    const now = Date.now();
    if (now - lastPauseTimeRef.current < DEBOUNCE_MS) return;
    lastPauseTimeRef.current = now;
    
    // Only show feedback if we've already started tracking
    if (!hasShownInitialRef.current) return;

    // Get reason-specific message
    let message: string;
    if (reason === 'tab_inactive' || reason === 'page_hidden') {
      message = isArabic ? 'التركيز متوقف — رجعت للتاب' : 'Focus paused — tab inactive';
    } else {
      message = isArabic ? 'التركيز متوقف مؤقتاً' : 'Focus paused';
    }

    toast.info(message, {
      duration: 2000,
      position: 'bottom-center',
      className: 'focus-toast-pause',
    });
  }, [isArabic]);

  /**
   * Show resume feedback - subtle, positive
   */
  const showResumeFeedback = useCallback(() => {
    const now = Date.now();
    if (now - lastResumeTimeRef.current < DEBOUNCE_MS) return;
    lastResumeTimeRef.current = now;
    
    // Mark that we've started (skip first resume notification)
    if (!hasShownInitialRef.current) {
      hasShownInitialRef.current = true;
      return;
    }

    toast.success(isArabic ? 'تم استئناف التركيز' : 'Focus resumed', {
      duration: 1500,
      position: 'bottom-center',
      className: 'focus-toast-resume',
    });
  }, [isArabic]);

  /**
   * Reset feedback state (e.g., on lesson change)
   */
  const resetFeedback = useCallback(() => {
    hasShownInitialRef.current = false;
    lastPauseTimeRef.current = 0;
    lastResumeTimeRef.current = 0;
  }, []);

  return {
    showPauseFeedback,
    showResumeFeedback,
    resetFeedback,
  };
};
