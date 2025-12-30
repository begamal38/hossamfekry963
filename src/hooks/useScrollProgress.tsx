import { useState, useEffect, useCallback } from 'react';

interface ScrollProgressOptions {
  /** The scroll distance over which the progress goes from 0 to 1 */
  scrollDistance?: number;
  /** Whether to disable on mobile */
  disableOnMobile?: boolean;
  /** Mobile breakpoint in pixels */
  mobileBreakpoint?: number;
}

export function useScrollProgress(options: ScrollProgressOptions = {}) {
  const {
    scrollDistance = 200,
    disableOnMobile = true,
    mobileBreakpoint = 768,
  } = options;

  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  const updateProgress = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const scrollY = window.scrollY;
    const newProgress = Math.min(1, Math.max(0, scrollY / scrollDistance));
    setProgress(newProgress);
  }, [scrollDistance]);

  const checkMobile = useCallback(() => {
    if (typeof window === 'undefined') return;
    setIsMobile(window.innerWidth < mobileBreakpoint);
  }, [mobileBreakpoint]);

  useEffect(() => {
    checkMobile();
    updateProgress();

    const handleScroll = () => {
      if (disableOnMobile && window.innerWidth < mobileBreakpoint) return;
      requestAnimationFrame(updateProgress);
    };

    const handleResize = () => {
      checkMobile();
      if (disableOnMobile && window.innerWidth < mobileBreakpoint) {
        setProgress(0);
      } else {
        updateProgress();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [updateProgress, checkMobile, disableOnMobile, mobileBreakpoint]);

  return {
    /** Progress from 0 (top) to 1 (scrolled past threshold) */
    progress: disableOnMobile && isMobile ? 0 : progress,
    /** Whether the scroll is complete (progress === 1) */
    isComplete: progress >= 1,
    /** Whether we're on mobile */
    isMobile,
  };
}
