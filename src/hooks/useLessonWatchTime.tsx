import { useState, useEffect, useRef, useCallback } from 'react';

const REQUIRED_WATCH_TIME_SECONDS = 20 * 60; // 20 minutes

interface UseLessonWatchTimeReturn {
  watchTimeSeconds: number;
  isCompleteButtonEnabled: boolean;
  remainingSeconds: number;
  isPlaying: boolean;
  startWatching: () => void;
  pauseWatching: () => void;
  resetWatching: () => void;
}

export function useLessonWatchTime(lessonId: string): UseLessonWatchTimeReturn {
  const [watchTimeSeconds, setWatchTimeSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLessonIdRef = useRef<string | null>(null);

  // Reset when lesson changes
  useEffect(() => {
    if (lastLessonIdRef.current !== lessonId) {
      setWatchTimeSeconds(0);
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      lastLessonIdRef.current = lessonId;
    }
  }, [lessonId]);

  // Timer logic
  useEffect(() => {
    if (isPlaying && watchTimeSeconds < REQUIRED_WATCH_TIME_SECONDS) {
      intervalRef.current = setInterval(() => {
        setWatchTimeSeconds(prev => {
          const newTime = prev + 1;
          // Stop incrementing once we reach the required time
          if (newTime >= REQUIRED_WATCH_TIME_SECONDS) {
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
          }
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, watchTimeSeconds]);

  const startWatching = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const pauseWatching = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resetWatching = useCallback(() => {
    setWatchTimeSeconds(0);
    setIsPlaying(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const isCompleteButtonEnabled = watchTimeSeconds >= REQUIRED_WATCH_TIME_SECONDS;
  const remainingSeconds = Math.max(0, REQUIRED_WATCH_TIME_SECONDS - watchTimeSeconds);

  return {
    watchTimeSeconds,
    isCompleteButtonEnabled,
    remainingSeconds,
    isPlaying,
    startWatching,
    pauseWatching,
    resetWatching,
  };
}

// Helper to format remaining time
export function formatRemainingTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
