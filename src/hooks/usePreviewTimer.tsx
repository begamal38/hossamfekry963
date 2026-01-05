import { useState, useEffect, useCallback, useRef } from 'react';

const PREVIEW_LIMIT_SECONDS = 3 * 60; // 3 minutes
const STORAGE_KEY_PREFIX = 'preview_time_';

interface PreviewTimerState {
  remainingSeconds: number;
  isLocked: boolean;
  isRunning: boolean;
}

interface UsePreviewTimerReturn extends PreviewTimerState {
  startTimer: () => void;
  pauseTimer: () => void;
  resetForNewLesson: (lessonId: string) => void;
}

/**
 * Hook to manage session-based preview timer for visitors
 * Timer runs only when video is playing and tab is active
 */
export const usePreviewTimer = (lessonId: string): UsePreviewTimerReturn => {
  const storageKey = `${STORAGE_KEY_PREFIX}${lessonId}`;
  
  // Get initial time from session storage
  const getStoredTime = (): number => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored) {
        const elapsed = parseInt(stored, 10);
        return Math.max(0, PREVIEW_LIMIT_SECONDS - elapsed);
      }
    } catch {
      // Session storage not available
    }
    return PREVIEW_LIMIT_SECONDS;
  };

  const [remainingSeconds, setRemainingSeconds] = useState(getStoredTime);
  const [isRunning, setIsRunning] = useState(false);
  const [isLocked, setIsLocked] = useState(getStoredTime() <= 0);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageKeyRef = useRef(storageKey);

  // Keep storageKey ref updated
  useEffect(() => {
    storageKeyRef.current = storageKey;
  }, [storageKey]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Timer logic - only depends on isRunning, isTabVisible, isLocked
  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && isTabVisible && !isLocked) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 0) {
            // Already at zero, lock it
            setIsLocked(true);
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          
          const newValue = prev - 1;
          
          // Save to session storage
          try {
            const elapsed = PREVIEW_LIMIT_SECONDS - newValue;
            sessionStorage.setItem(storageKeyRef.current, elapsed.toString());
          } catch {
            // Session storage not available
          }
          
          if (newValue <= 0) {
            setIsLocked(true);
            setIsRunning(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            return 0;
          }
          
          return newValue;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isTabVisible, isLocked]);

  // Stable startTimer - no dependencies on changing values
  const startTimer = useCallback(() => {
    setIsRunning((running) => {
      // Only start if not already running
      return true;
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetForNewLesson = useCallback((newLessonId: string) => {
    // Stop current timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    
    // Each lesson has its own timer in session storage
    const newStorageKey = `${STORAGE_KEY_PREFIX}${newLessonId}`;
    try {
      const stored = sessionStorage.getItem(newStorageKey);
      if (stored) {
        const elapsed = parseInt(stored, 10);
        const remaining = Math.max(0, PREVIEW_LIMIT_SECONDS - elapsed);
        setRemainingSeconds(remaining);
        setIsLocked(remaining <= 0);
      } else {
        setRemainingSeconds(PREVIEW_LIMIT_SECONDS);
        setIsLocked(false);
      }
    } catch {
      setRemainingSeconds(PREVIEW_LIMIT_SECONDS);
      setIsLocked(false);
    }
  }, []);

  // Check lock state based on remainingSeconds
  useEffect(() => {
    if (remainingSeconds <= 0 && !isLocked) {
      setIsLocked(true);
      setIsRunning(false);
    }
  }, [remainingSeconds, isLocked]);

  return {
    remainingSeconds,
    isLocked,
    isRunning,
    startTimer,
    pauseTimer,
    resetForNewLesson,
  };
};
