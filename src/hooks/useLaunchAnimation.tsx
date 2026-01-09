import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'hf_launch_shown';
const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

/**
 * Hook to manage launch animation state.
 * Shows animation only once per session (30 min window).
 * Skips if app loads faster than animation would take.
 */
export const useLaunchAnimation = () => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we should show animation
    const lastShown = sessionStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (!lastShown || (now - parseInt(lastShown, 10)) > SESSION_DURATION) {
      // Only show on mobile devices
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setShowAnimation(true);
        sessionStorage.setItem(STORAGE_KEY, now.toString());
      } else {
        setIsReady(true);
      }
    } else {
      setIsReady(true);
    }
  }, []);

  const handleAnimationComplete = useCallback(() => {
    setShowAnimation(false);
    setIsReady(true);
  }, []);

  return {
    showAnimation,
    isReady,
    handleAnimationComplete
  };
};

export default useLaunchAnimation;
