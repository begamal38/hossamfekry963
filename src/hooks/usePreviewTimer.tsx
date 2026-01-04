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

  // Save elapsed time to session storage
  const saveElapsedTime = useCallback((remaining: number) => {
    try {
      const elapsed = PREVIEW_LIMIT_SECONDS - remaining;
      sessionStorage.setItem(storageKey, elapsed.toString());
    } catch {
      // Session storage not available
    }
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

  // Timer logic
  useEffect(() => {
    if (isRunning && isTabVisible && !isLocked && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const newValue = prev - 1;
          saveElapsedTime(newValue);
          
          if (newValue <= 0) {
            setIsLocked(true);
            setIsRunning(false);
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
  }, [isRunning, isTabVisible, isLocked, saveElapsedTime, remainingSeconds]);

  // Pause timer when tab becomes hidden
  useEffect(() => {
    if (!isTabVisible && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isTabVisible]);

  const startTimer = useCallback(() => {
    if (!isLocked && remainingSeconds > 0) {
      setIsRunning(true);
    }
  }, [isLocked, remainingSeconds]);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetForNewLesson = useCallback((newLessonId: string) => {
    // This is called when switching lessons
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
    setIsRunning(false);
  }, []);

  return {
    remainingSeconds,
    isLocked,
    isRunning,
    startTimer,
    pauseTimer,
    resetForNewLesson,
  };
};
