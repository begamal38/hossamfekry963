import { useState, useEffect, useRef, useCallback } from 'react';

interface UseExamTimerProps {
  timeLimitMinutes: number | null;
  startedAt: string | null; // ISO string of when student started
  isActive: boolean; // Only count when exam is active (not submitted)
  onTimeUp: () => void;
}

interface UseExamTimerReturn {
  remainingSeconds: number;
  totalSeconds: number;
  isTimerActive: boolean;
  isExpired: boolean;
  percentRemaining: number;
}

/**
 * useExamTimer - Local countdown timer synced to start_time
 * 
 * - No server polling
 * - Calculates remaining from startedAt + timeLimitMinutes
 * - Fires onTimeUp callback when time reaches 0
 * - Survives page refresh (uses startedAt from DB)
 */
export function useExamTimer({
  timeLimitMinutes,
  startedAt,
  isActive,
  onTimeUp,
}: UseExamTimerProps): UseExamTimerReturn {
  const hasTimer = timeLimitMinutes !== null && timeLimitMinutes > 0 && !!startedAt;
  const totalSeconds = hasTimer ? timeLimitMinutes! * 60 : 0;
  
  const calculateRemaining = useCallback(() => {
    if (!hasTimer || !startedAt) return totalSeconds;
    const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(totalSeconds - elapsed));
  }, [hasTimer, startedAt, totalSeconds]);

  const [remainingSeconds, setRemainingSeconds] = useState(calculateRemaining);
  const onTimeUpRef = useRef(onTimeUp);
  const hasExpiredRef = useRef(false);

  // Keep callback ref fresh
  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  // Reset when startedAt changes
  useEffect(() => {
    setRemainingSeconds(calculateRemaining());
    hasExpiredRef.current = false;
  }, [calculateRemaining]);

  // Countdown interval
  useEffect(() => {
    if (!hasTimer || !isActive) return;

    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      if (remaining <= 0 && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        clearInterval(interval);
        onTimeUpRef.current();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasTimer, isActive, calculateRemaining]);

  const isExpired = hasTimer && remainingSeconds <= 0;
  const percentRemaining = totalSeconds > 0 ? (remainingSeconds / totalSeconds) * 100 : 100;

  return {
    remainingSeconds,
    totalSeconds,
    isTimerActive: hasTimer && isActive && !isExpired,
    isExpired,
    percentRemaining,
  };
}

